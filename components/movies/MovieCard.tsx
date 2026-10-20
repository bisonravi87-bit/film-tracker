"use client";
import Image from "next/image";
import { Check, Heart, Star } from "lucide-react";
import type { Movie } from "@/lib/types";

interface Props {
  movie: Movie;
  watched: boolean;
  rating: number | null;
  isFavorite: boolean;
  onToggleWatched: () => void;
  onOpen: () => void;
}

export default function MovieCard({ movie, watched, rating, isFavorite, onToggleWatched, onOpen }: Props) {
  return (
    <div className="group relative text-left">
      {/* Clic en el póster: abre el modal de acciones rápidas */}
      <button type="button" onClick={onOpen} aria-label={`Abrir acciones de ${movie.title}`} className="block w-full cursor-pointer">
        <div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-line">
          {movie.poster_path ? (
            <Image src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt="" fill sizes="(max-width:640px) 45vw, 200px"
              className="object-cover transition duration-200 group-hover:brightness-90"
              style={watched ? { filter: "grayscale(70%)", opacity: 0.55 } : undefined} />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-sm text-slate2">Sin póster</div>
          )}
          {watched && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-sm border-2 border-stamp bg-paper/80 px-3 py-1 text-lg font-extrabold tracking-wide text-stamp">
              VISTA
            </span>
          )}
          {isFavorite && (
            <span className="absolute left-2 top-2 rounded-full bg-ink/80 p-1 text-paper" title="Favorita">
              <Heart size={13} className="fill-current" />
            </span>
          )}
          {rating !== null && (
            <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-ink/80 px-1.5 py-0.5 text-[11px] font-bold text-paper"
              title={`Tu nota: ${rating}/10`}>
              <Star size={11} className="fill-current" />{rating}
            </span>
          )}
        </div>
      </button>
      {/* Botón «vista»: marca/desmarca al instante (área táctil ≥ 44 px) */}
      <button type="button" onClick={onToggleWatched}
        aria-pressed={watched}
        aria-label={`${movie.title}: ${watched ? "marcar como pendiente" : "marcar como vista"}`}
        className={`absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-full transition
          ${watched ? "bg-stamp text-white hover:bg-ink" : "bg-ink/60 text-white hover:bg-stamp"}`}>
        <Check size={18} aria-hidden />
      </button>
      <p className={`mt-2 pr-10 text-sm font-medium leading-tight ${watched ? "text-slate2 line-through" : ""}`}>{movie.title}</p>
      <p className="pr-10 text-xs text-slate2">{movie.release_year}</p>
    </div>
  );
}
