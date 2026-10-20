import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Movie, StatusMap } from "@/lib/types";
import MovieGrid from "@/components/movies/MovieGrid";

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: genre } = await supabase.from("genres")
    .select("id, name, slug, is_custom").eq("slug", slug).maybeSingle();
  if (!genre) notFound();

  const { data: rows } = await supabase
    .from("movie_genres")
    .select("movies(id, title, original_title, release_year, poster_path, backdrop_path, overview, runtime, vote_average)")
    .eq("genre_id", genre.id)
    .order("movies(release_year)", { ascending: true, nullsFirst: false });

  const movies = (rows ?? [])
    .map((r) => (r as { movies: unknown }).movies)
    .filter((m): m is Movie => Boolean(m && (m as Movie).title));

  const ids = movies.map((m) => m.id);
  const initialStatus: StatusMap = {};
  if (ids.length > 0) {
    const { data: statuses } = await supabase
      .from("user_movie_status")
      .select("movie_id, watched, watched_at, rating, notes, is_favorite")
      .in("movie_id", ids);
    for (const s of statuses ?? []) {
      initialStatus[s.movie_id] = {
        watched: s.watched, watched_at: s.watched_at, rating: s.rating,
        notes: s.notes, is_favorite: s.is_favorite,
      };
    }
  }

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <nav className="text-xs text-slate2">
          <Link href="/genres" className="underline hover:text-stamp">Géneros y estilos</Link> / {genre.name}
        </nav>
        <h1 className="text-3xl font-bold">{genre.name}</h1>
      </div>
      <MovieGrid movies={movies} initialStatus={initialStatus} />
    </main>
  );
}
