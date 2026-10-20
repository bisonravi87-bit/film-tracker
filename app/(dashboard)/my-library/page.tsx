import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./LibraryClient";
import type { StatusMap, Status, Movie } from "@/lib/types";

export interface LibraryItem {
  movie: Movie;
  status: Status;
  directors: Array<{ id: string; name: string }>;
}

export default async function MyLibraryPage() {
  const supabase = await createClient();

  // Todas las filas del usuario unidas con películas (plan Fase 4).
  const { data: rows } = await supabase
    .from("user_movie_status")
    .select("movie_id, watched, watched_at, rating, notes, is_favorite, movies(*), movie_directors(directors(id, name))")
    .order("updated_at", { ascending: false });

  const items: LibraryItem[] = [];
  const directorIds = new Set<string>();
  for (const r of rows ?? []) {
    const movie = (r.movies ?? null) as unknown as Movie | null;
    if (!movie || !movie.title) continue;
    const mds = ((r as unknown as { movie_directors?: Array<{ directors?: { id: string; name: string } }> }).movie_directors) ?? [];
    const directors = mds.map((md) => md.directors).filter((d): d is { id: string; name: string } => !!d);
    directors.forEach((d) => directorIds.add(d.id));
    items.push({
      movie,
      status: { watched: r.watched, watched_at: r.watched_at, rating: r.rating, notes: r.notes, is_favorite: r.is_favorite },
      directors,
    });
  }

  // «Pendientes» = películas cacheadas de directores en seguimiento aún no vistas.
  // Solo se muestran si el usuario ya tachó algo (así se sabe a quién hace seguimiento).
  if (directorIds.size > 0) {
    const { data: filmography } = await supabase
      .from("movie_directors")
      .select("director_id, directors(name), movies(id, title, original_title, release_year, poster_path, backdrop_path, overview, runtime, vote_average)")
      .in("director_id", [...directorIds]);
    const inLibrary = new Set(items.map((i) => i.movie.id));
    const byDirector: LibraryItem[] = [];
    for (const f of filmography ?? []) {
      const movie = (f.movies ?? null) as unknown as Movie | null;
      if (!movie || !movie.title || inLibrary.has(movie.id)) continue;
      const directorObj = (f as unknown as { directors?: { name: string } | Array<{ name: string }> }).directors;
      const director = Array.isArray(directorObj) ? directorObj[0] : directorObj;
      byDirector.push({
        movie,
        status: { watched: false, watched_at: null, rating: null, notes: null, is_favorite: false },
        directors: director ? [{ id: f.director_id, name: director.name }] : [],
      });
    }
    items.push(...byDirector);
  }

  return <LibraryClient items={items} />;
}
