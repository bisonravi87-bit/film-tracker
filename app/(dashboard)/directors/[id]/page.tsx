import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getDirectorFilmography } from "@/lib/tmdb";
import type { StatusMap } from "@/lib/types";
import DirectorHeader from "@/components/director/DirectorHeader";
import MovieGrid from "@/components/movies/MovieGrid";

export default async function DirectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDirectorFilmography(id).catch(() => null);
  if (!data) notFound();
  const { director, movies } = data;
  const movieIds = movies.map((m) => m.id);

  // Caché en Supabase (necesario para la FK de user_movie_status).
  // Se saltan los upserts si el director ya está cacheado (rendimiento, plan 5.5).
  const admin = createAdminClient();
  const { data: cachedDir } = await admin.from("directors").select("id").eq("id", director.id).maybeSingle();
  if (!cachedDir) {
    await admin.from("directors").upsert(director);
  }
  const { data: cachedRels } = await admin.from("movie_directors").select("movie_id")
    .eq("director_id", director.id);
  const cachedMovieIds = new Set((cachedRels ?? []).map((r) => r.movie_id));
  const missing = movies.filter((m) => !cachedMovieIds.has(m.id));
  if (missing.length > 0) {
    await admin.from("movies").upsert(missing);
    await admin.from("movie_directors").upsert(missing.map((m) => ({ movie_id: m.id, director_id: director.id })));
  }

  // Estado COMPLETO del usuario para las filmografía cacheada (plan Fase 2, tarea 2).
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("user_movie_status")
    .select("movie_id, watched, watched_at, rating, notes, is_favorite")
    .in("movie_id", movieIds);

  const initialStatus: StatusMap = {};
  for (const r of rows ?? []) {
    initialStatus[r.movie_id] = {
      watched: r.watched, watched_at: r.watched_at, rating: r.rating,
      notes: r.notes, is_favorite: r.is_favorite,
    };
  }

  return (
    <main className="space-y-8">
      <DirectorHeader director={director} />
      <MovieGrid movies={movies} initialStatus={initialStatus} />
    </main>
  );
}
