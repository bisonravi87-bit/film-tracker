import type { Director, Movie, PersonResult } from "@/lib/types";

const BASE = "https://api.themoviedb.org/3";
/** Español de España para todos los títulos. Cambios aquí invalidan la caché de 24 h. */
const LANGUAGE = "es-ES";
const API_KEY = process.env.TMDB_API_KEY ?? "";

interface TmdbCrewCredit {
  id: number;
  title: string;
  original_title?: string | null;
  job: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string | null;
  vote_average?: number | null;
}

interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string | null;
}

interface TmdbMovieDetail {
  id: number;
  runtime: number | null;
}

async function tmdb<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} en ${path}`);
  return res.json();
}

export async function searchPeople(query: string): Promise<PersonResult[]> {
  const data = await tmdb<{ results: PersonResult[] }>(
    `/search/person?query=${encodeURIComponent(query)}&language=${LANGUAGE}`,
  );
  return data.results.filter((p) => p.known_for_department === "Directing").slice(0, 8);
}

export async function getDirectorFilmography(personId: string): Promise<{ director: Director; movies: Movie[] }> {
  const [person, credits] = await Promise.all([
    tmdb<TmdbPerson>(`/person/${personId}?language=${LANGUAGE}`),
    tmdb<{ crew: TmdbCrewCredit[] }>(`/person/${personId}/movie_credits?language=${LANGUAGE}`),
  ]);
  const seen = new Set<number>();
  const movies: Movie[] = credits.crew
    .filter((c) => c.job === "Director" && c.release_date && !seen.has(c.id) && seen.add(c.id))
    // Oculta créditos ante la cámara («Self», documentales de archivo) que no son dirección real
    .filter((c) => !/^(self|himself|herself)$/i.test(c.job))
    .map((c) => ({
      id: String(c.id), title: c.title, original_title: c.original_title ?? null,
      release_year: Number(c.release_date.slice(0, 4)), poster_path: c.poster_path ?? null,
      backdrop_path: c.backdrop_path ?? null, overview: c.overview ?? null, runtime: null,
      vote_average: c.vote_average ?? null,
    }))
    .sort((a, b) => (a.release_year ?? 0) - (b.release_year ?? 0));
  return {
    director: { id: String(person.id), name: person.name, profile_path: person.profile_path, biography: person.biography },
    movies,
  };
}

/** Detalle de película; se usa bajo demanda para completar `runtime` de las vistas. */
export async function getMovieDetails(movieId: string): Promise<TmdbMovieDetail> {
  return tmdb<TmdbMovieDetail>(`/movie/${movieId}`);
}

/** Géneros canónicos de TMDB en español (para el script de siembra). */
export async function getTmdbGenres(): Promise<Array<{ id: number; name: string }>> {
  return tmdb<{ genres: Array<{ id: number; name: string }> }>(`/genre/movie/list?language=${LANGUAGE}`).then((d) => d.genres);
}

/** Película por ID de TMDB (para estilos curados). */
export interface TmdbMovieFull {
  id: number; title: string; original_title: string; release_date: string;
  poster_path: string | null; backdrop_path: string | null; overview: string | null;
  runtime: number | null; vote_average: number | null; genres: Array<{ id: number }>;
}

export async function getTmdbMovie(movieId: number): Promise<TmdbMovieFull | null> {
  return tmdb<TmdbMovieFull>(`/movie/${movieId}?language=${LANGUAGE}`).catch(() => null);
}
