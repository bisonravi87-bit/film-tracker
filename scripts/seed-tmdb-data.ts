/**
 * Siembra de datos de TMDB en Supabase.
 *
 * Requiere, en el entorno:
 *   - TMDB_API_KEY: el «API Read Access Token» (JWT largo) de themoviedb.org
 *   - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)
 *   - La base de datos ya debe tener el esquema (supabase/schema.sql).
 *
 * Modos (npm run …):
 *   genres    – inserta los géneros canónicos de TMDB en `genres`
 *   discover  – para cada género, guarda las N películas más votadas en `movies` + `movie_genres`
 *   styles    – curados de scripts/curated-styles.json: busca cada título en TMDB,
 *               inserta el estilo (is_custom = true) y rellena películas
 *   all       – genres + discover + styles
 *
 * Configurables en la constante CONFIG de abajo (películas por género, idioma, pausa).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const CONFIG = {
  /** Películas más votadas guardadas por género canónico (plan: 150). */
  MOVIES_PER_GENRE: 150,
  PAGES_PER_GENRE: 8, // 8 páginas × 20 = 160 → se recortan a MOVIES_PER_GENRE
  LANGUAGE: "es-ES",
  /** Pausa entre peticiones en ms (respetar límites de TMDB). */
  PAUSE_MS: 350,
};

const BASE = "https://api.themoviedb.org/3";
const TOKEN = process.env.TMDB_API_KEY ?? "";
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tmdb<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} en ${path}`);
  return res.json();
}

const slugify = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface TmdbMovie {
  id: number; title: string; original_title: string;
  release_date: string; poster_path: string | null; backdrop_path: string | null;
  overview: string | null; runtime: number | null; vote_average: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  genres?: Array<{ id: number; name?: string }>;
}

function movieRow(m: TmdbMovie) {
  return {
    id: String(m.id), title: m.title, original_title: m.original_title ?? null,
    release_year: m.release_date?.slice(0, 4) ? Number(m.release_date.slice(0, 4)) : null,
    poster_path: m.poster_path ?? null, backdrop_path: m.backdrop_path ?? null,
    overview: m.overview ?? null, runtime: m.runtime ?? null,
    vote_average: m.vote_average != null ? Math.round(m.vote_average * 10) / 10 : null,
  };
}

async function getSupabase(): Promise<SupabaseClient> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

// 3.1 — Géneros canónicos de TMDB
async function seedGenres(supabase: SupabaseClient) {
  const { genres } = await tmdb<{ genres: Array<{ id: number; name: string }> }>(
    `/genre/movie/list?language=${CONFIG.LANGUAGE}`,
  );
  const rows = genres.map((g) => ({ id: g.id, name: g.name, slug: slugify(g.name), is_custom: false }));
  const { error } = await supabase.from("genres").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`Géneros insertados: ${rows.length}`);
}

async function upsertMovieWithGenres(
  supabase: SupabaseClient, movie: TmdbMovie, extraGenres: Array<{ id: number; name?: string }>, detail = true,
) {
  const full = curatedCache.get(movie.id) ?? (detail ? await tmdb<TmdbMovie>(`/movie/${movie.id}?language=${CONFIG.LANGUAGE}`) : movie);
  curatedCache.set(movie.id, full);
  await supabase.from("movies").upsert(movieRow(full));
  const genreIds = [...new Set([...(full.genres ?? []).map((g) => g.id), ...extraGenres.map((g) => g.id)])];
  if (genreIds.length) {
    await supabase.from("movie_genres").upsert(genreIds.map((gid) => ({ movie_id: String(full.id), genre_id: gid })));
  }
  await sleep(CONFIG.PAUSE_MS);
  return true;
}

// Resolución por búsqueda: cada estilo da títulos (año opcional) y el script
// busca el ID real en TMDB en lugar de confiar en IDs escritos de memoria.
const curatedCache = new Map<number, TmdbMovie>();

interface TmdbSearchResult { results: Array<TmdbMovie & { release_date?: string }> }

async function searchMovie(rawQuery: string): Promise<{ data: TmdbMovie } | null> {
  const match = rawQuery.match(/(.+?),?\s+(\d{4})$/);
  const title = match?.[1] ?? rawQuery;
  const year = match?.[2];
  const path = `/search/movie?query=${encodeURIComponent(title)}&language=${CONFIG.LANGUAGE}${year ? `&year=${year}` : ""}`;
  const data = await tmdb<TmdbSearchResult>(path);
  await sleep(CONFIG.PAUSE_MS);

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  const target = norm(title);
  // Solo candidatos estrenados, con póster y alguna valencia real.
  const candidates = data.results.filter((r) => r.poster_path && r.release_date && (r.vote_count ?? 0) > 0);
  const yearOk = candidates.filter((r) => year ? r.release_date.startsWith(year) : true);

  // Puntuación: coincidencia exacta de título (visitado en ≥ 1e6), segundos prefijos,
  // luego votos y popularidad reales de TMDB. Evita documentales/remakes con el mismo nombre.
  const scored = (yearOk.length ? yearOk : []).map((r) => {
    let score = (r.vote_count ?? 0) + (r.popularity ?? 0) / 10;
    const t = norm(r.title ?? ""); const o = norm(r.original_title ?? "");
    if (t === target || o === target) score += 1e6;
    else if (t.startsWith(target) || o.startsWith(target) || target.startsWith(t) || target.startsWith(o)) score += 4e5;
    return { r, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0]?.r;
  if (!best) { console.warn(`  Sin candidato fiable para ${rawQuery}`); return null; }
  return { data: best };
}

async function seedStyles(supabase: SupabaseClient) {
  const styles = JSON.parse(
    readFileSync(resolve(process.cwd(), "scripts", "curated-styles.json"), "utf-8"),
  ) as Record<string, { name: string; queries: string[] }>;

  for (const [slug, style] of Object.entries(styles)) {
    // IDs negativos para estilos que TMDB no tiene como género (según el esquema)
    const customId = await ensureCustomGenre(supabase, style.name, slug);
    let added = 0;
    for (const query of style.queries) {
      const found = await searchMovie(query);
      if (!found) { console.warn(`  No encontrado: ${query}`); continue; }
      const ok = await upsertMovieWithGenres(supabase, found.data, [{ id: customId }]);
      console.log(`  ${ok ? "✓" : "✗"} ${style.name} → ${found.data.title} (${query}; https://www.themoviedb.org/movie/${found.data.id})`);
      if (ok) added += 1;
    }
    console.log(`Estilo «${style.name}» listo: ${added} películas.`);
  }
}

async function ensureCustomGenre(supabase: SupabaseClient, name: string, slug: string): Promise<number> {
  // Reutiliza el estilo si ya existe (no duplica al re-ejecutar el script).
  const { data: existing } = await supabase.from("genres").select("id").eq("slug", slug).maybeSingle();
  if (existing) return existing.id as number;
  // Nuevos estilos reciben IDs negativos: -1, -2, … según se creen.
  const { data: minRow } = await supabase.from("genres").select("id").order("id", { ascending: true }).limit(1);
  const min = minRow?.[0]?.id as number | undefined;
  const customId = (min != null && min < 0 ? min : 0) - 1;
  const { error } = await supabase.from("genres").upsert(
    { id: customId, name, slug, is_custom: true }, { onConflict: "id" },
  );
  if (error) throw error;
  return customId;
}

// 3.1 — Películas más votadas por género
async function seedDiscover(supabase: SupabaseClient) {
  const { data: genres } = await supabase.from("genres").select("id, slug").eq("is_custom", false);
  for (const genre of genres ?? []) {
    const pageMovies: TmdbMovie[] = [];
    for (let page = 1; page <= CONFIG.PAGES_PER_GENRE; page += 1) {
      const data = await tmdb<{ results: TmdbMovie[] }>(
        `/discover/movie?with_genres=${genre.id}&sort_by=vote_count.desc&language=${CONFIG.LANGUAGE}&page=${page}`,
      );
      pageMovies.push(...data.results);
      await sleep(CONFIG.PAUSE_MS);
    }
    const top = pageMovies
      .sort((a, b) => (b.vote_average ?? 0) * Math.log(Math.max(1, b.vote_count ?? 1)) - (a.vote_average ?? 0) * Math.log(Math.max(1, a.vote_count ?? 1)))
      .slice(0, CONFIG.MOVIES_PER_GENRE);
    let stored = 0;
    for (const m of top) {
      // detail = false: el /discover no trae runtime ni géneros propios, y son
      // 150 películas por género; el runtime se completa desde la app (plan 3.4).
      if (await upsertMovieWithGenres(supabase, m, [{ id: genre.id }], false)) stored += 1;
    }
    console.log(`Género ${genre.slug}: ${stored} películas guardadas.`);
  }
}

async function main() {
  const supabase = await getSupabase();
  const mode = process.argv[2] ?? "all";
  if (mode === "genres" || mode === "all") { await seedGenres(supabase); await sleep(CONFIG.PAUSE_MS); }
  if (mode === "discover" || mode === "all") { await seedDiscover(supabase); }
  if (mode === "styles" || mode === "all") { await seedStyles(supabase); }
  console.log("Terminado.");
}

void main().catch((err) => { console.error(err); process.exit(1); });
