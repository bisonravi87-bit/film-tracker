"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { ExternalLink, Heart, Star } from "lucide-react";
import type { Movie, Status } from "@/lib/types";

interface Props {
  movie: Movie;
  status: Status;
  onChange: (patch: Partial<Status>) => void;
  onClose: () => void;
}

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Modal de acciones rápidas sobre un `<dialog>` nativo: Disco fijo de foco
 * (modo modal), cierre con Esc y devolución automática del foco al opener.
 */
export default function MovieStatusModal({ movie, status, onChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  function close() {
    // El <dialog> nativo ya devuelve el foco al elemento que lo tenía antes de abrirse.
    dialogRef.current?.close();
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="modal-title"
      className="w-[min(95vw,32rem)] rounded-sm border border-line bg-paper p-0 text-ink backdrop:bg-ink/50">
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-center gap-4 border-b border-line p-4">
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-sm bg-line">
            {movie.poster_path && (
              <Image src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`} alt="" fill className="object-cover" />
            )}
          </div>
          <div>
            <h2 id="modal-title" className="text-xl font-bold leading-tight">{movie.title}</h2>
            <p className="text-sm text-slate2">{movie.release_year}{movie.runtime ? ` · ${movie.runtime} min` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs underline hover:text-stamp">
                Ficha en TMDB <ExternalLink size={12} aria-hidden />
              </a>
              <a href={`https://www.justwatch.com/es/buscar?q=${encodeURIComponent(movie.title)}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs underline hover:text-stamp">
                ¿Dónde verla? <ExternalLink size={12} aria-hidden />
              </a>
            </div>
          </div>
        </header>

        <div className="space-y-5 overflow-y-auto p-4">
          {/* Interruptor «Vista» */}
          <div className="flex items-center justify-between">
            <label htmlFor="watched-toggle" className="font-medium">Vista</label>
            <button id="watched-toggle" type="button" role="switch" aria-checked={status.watched}
              onClick={() => onChange({ watched: !status.watched })}
              className={`relative h-7 w-12 rounded-full transition ${status.watched ? "bg-stamp" : "bg-line"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-paper transition-all ${status.watched ? "left-6" : "left-1"}`} />
            </button>
          </div>

          {/* Nota 1–10; vacía se guarda como null */}
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-1 font-medium"><Star size={15} aria-hidden /> Tu nota</legend>
            <div className="flex flex-wrap gap-1">
              {RATINGS.map((n) => (
                <button key={n} type="button" aria-pressed={status.rating === n}
                  onClick={() => onChange({ rating: status.rating === n ? null : n })}
                  className={`h-10 w-10 rounded-sm border text-sm font-semibold
                    ${status.rating === n ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Comentario */}
          <div className="space-y-1">
            <label htmlFor="note-field" className="font-medium">Comentario</label>
            <textarea id="note-field" rows={4} maxLength={1000} value={status.notes ?? ""}
              onChange={(e) => onChange({ notes: e.target.value || null })}
              placeholder="¿Qué te pareció? (máx. 1000 caracteres)"
              className="w-full rounded-sm border border-line bg-white px-3 py-2 text-sm" />
            <p className="text-right text-xs text-slate2">{(status.notes ?? "").length}/1000</p>
          </div>

          {/* Favorita */}
          <div className="flex items-center justify-between">
            <label htmlFor="fav-toggle" className="flex items-center gap-1 font-medium">
              <Heart size={15} aria-hidden /> Favorita
            </label>
            <button id="fav-toggle" type="button" role="switch" aria-checked={status.is_favorite}
              onClick={() => onChange({ is_favorite: !status.is_favorite })}
              className={`relative h-7 w-12 rounded-full transition ${status.is_favorite ? "bg-stamp" : "bg-line"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-paper transition-all ${status.is_favorite ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-line p-4">
          <button type="button" onClick={close}
            className="rounded-sm bg-ink px-4 py-2 text-sm text-paper hover:bg-stamp">Guardar y cerrar</button>
        </footer>
      </div>
    </dialog>
  );
}
