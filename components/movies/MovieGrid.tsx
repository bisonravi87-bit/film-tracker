"use client";
import { useState } from "react";
import type { Movie, Status, StatusMap } from "@/lib/types";
import { EMPTY_STATUS } from "@/lib/types";
import { useMovieStatuses } from "@/lib/useMovieStatuses";
import CompletionBar from "@/components/director/CompletionBar";
import MovieCard from "./MovieCard";
import MovieStatusModal from "./MovieStatusModal";

type Sort = "year" | "rating" | "title";

/**
 * Cuadrícula reutilizable (director y géneros). Dos gestos: clic en el póster
 * abre el modal; el botón redondo marca/desmarca «vista» al instante.
 */
export default function MovieGrid({ movies, initialStatus }: { movies: Movie[]; initialStatus: StatusMap }) {
  const { statuses, saveStatus, toggleWatched, error } = useMovieStatuses(initialStatus);
  const [sort, setSort] = useState<Sort>("year");
  const [openMovie, setOpenMovie] = useState<Movie | null>(null);

  const sorted = [...movies].sort((a, b) =>
    sort === "title" ? a.title.localeCompare(b.title)
    : sort === "rating" ? (b.vote_average ?? 0) - (a.vote_average ?? 0)
    : (a.release_year ?? 0) - (b.release_year ?? 0));

  const watchedCount = movies.filter((m) => statuses[m.id]?.watched).length;

  return (
    <section className="space-y-6">
      <CompletionBar watched={watchedCount} total={movies.length} />
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate2">Ordenar por</span>
        {([["año", "year"], ["nota TMDB", "rating"], ["título", "title"]] as [string, Sort][]).map(([label, k]) => (
          <button key={k} onClick={() => setSort(k)} aria-pressed={sort === k}
            className={`rounded-sm border px-3 py-1 ${sort === k ? "border-ink bg-ink text-paper" : "border-line"}`}>{label}</button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-stamp">{error}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {sorted.map((m) => (
          <MovieCard key={m.id} movie={m}
            watched={!!statuses[m.id]?.watched}
            rating={statuses[m.id]?.rating ?? null}
            isFavorite={!!statuses[m.id]?.is_favorite}
            onToggleWatched={() => toggleWatched(m.id)}
            onOpen={() => setOpenMovie(m)} />
        ))}
      </div>
      {openMovie && (
        <MovieStatusModal movie={openMovie}
          status={statuses[openMovie.id] ?? EMPTY_STATUS}
          onChange={(patch: Partial<Status>) => saveStatus(openMovie.id, patch)}
          onClose={() => setOpenMovie(null)} />
      )}
    </section>
  );
}
