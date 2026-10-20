"use client";
import { useMemo, useState } from "react";
import type { Status } from "@/lib/types";
import { useMovieStatuses } from "@/lib/useMovieStatuses";
import CompletionBar from "@/components/director/CompletionBar";
import MovieCard from "@/components/movies/MovieCard";
import MovieStatusModal from "@/components/movies/MovieStatusModal";
import type { LibraryItem } from "./page";

type Tab = "watched" | "pending" | "favorites";

const TABS: Array<[Tab, string]> = [["watched", "Vistas"], ["pending", "Pendientes"], ["favorites", "Favoritas"]];

export default function LibraryClient({ items }: { items: LibraryItem[] }) {
  const [tab, setTab] = useState<Tab>("watched");
  const [director, setDirector] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [year, setYear] = useState("");
  const [openMovie, setOpenMovie] = useState<LibraryItem | null>(null);
  // El estado en vivo prevalece sobre el que recibió el servidor.
  const { statuses, saveStatus, toggleWatched, error } = useMovieStatuses(buildMap(items));

  const effective = (i: LibraryItem): Status => statuses[i.movie.id] ?? i.status;

  const directorOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const i of items) for (const d of i.directors) set.set(d.id, d.name);
    return [...set.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const counts = useMemo(
    () => ({
      watched: items.filter((i) => effective(i).watched).length,
      pending: items.filter((i) => !effective(i).watched).length,
      favorites: items.filter((i) => effective(i).is_favorite).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, statuses],
  );

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const s = effective(i);
      if (tab === "watched" && !s.watched) return false;
      if (tab === "pending" && s.watched) return false;
      if (tab === "favorites" && !s.is_favorite) return false;
      if (director && !i.directors.some((d) => d.id === director)) return false;
      if (minRating > 0 && (s.rating ?? 0) < minRating) return false;
      if (year && String(i.movie.release_year ?? "") !== year) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, statuses, tab, director, minRating, year]);

  const watchedCount = counts.watched;

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Mi biblioteca</h1>
        <p className="text-sm text-slate2">Todo lo que has marcado, y también lo que te queda por tachar.</p>
      </header>

      {/* Filtros: por director, por nota mínima y por año (plan Fase 4) */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mr-2 text-slate2">Director</span>
          <select value={director} onChange={(e) => setDirector(e.target.value)}
            className="rounded-sm border border-line bg-white px-2 py-1.5">
            <option value="">Todos</option>
            {directorOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        {tab === "watched" && (
          <label className="text-sm">
            <span className="mr-2 text-slate2">Nota mínima</span>
            <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-sm border border-line bg-white px-2 py-1.5">
              <option value={0}>Cualquiera</option>
              {[10, 9, 8, 7, 6, 5].map((n) => <option key={n} value={n}>A partir de {n}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm">
          <span className="mr-2 text-slate2">Año</span>
          <input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric" placeholder="p. ej. 1968"
            className="w-28 rounded-sm border border-line bg-white px-2 py-1.5" />
        </label>
        <button type="button" onClick={() => { setDirector(""); setMinRating(0); setYear(""); }}
          className="rounded-sm border border-line px-3 py-1.5 text-sm hover:border-ink">Borrar filtros</button>
      </div>

      <CompletionBar watched={watchedCount} total={items.length} />

      {/* Pestañas */}
      <div role="tablist" aria-label="Secciones de la biblioteca" className="flex gap-2 border-b border-line pb-2">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key}
            aria-controls={`panel-${key}`} id={`tab-${key}`} onClick={() => setTab(key)}
            className={`rounded-sm border px-3 py-1.5 text-sm ${tab === key ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
            {label} <span className="tabular-nums">{counts[key]}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-stamp">{error}</p>}

      <div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((item) => {
          const s = effective(item);
          return (
            <MovieCard key={item.movie.id} movie={item.movie}
              watched={!!s.watched} rating={s.rating} isFavorite={!!s.is_favorite}
              onToggleWatched={() => toggleWatched(item.movie.id)}
              onOpen={() => setOpenMovie(item)} />
          );
        })}
      </div>
      <p className="text-sm text-slate2">{filtered.length} película{filtered.length === 1 ? "" : "s"} filtrada{filtered.length === 1 ? "" : "s"}</p>
      {filtered.length === 0 && <p className="text-sm text-slate2">Nada por aquí. Cambia de pestaña o borra los filtros.</p>}

      {openMovie && (
        <MovieStatusModal movie={openMovie.movie} status={effective(openMovie)}
          onChange={(patch: Partial<Status>) => saveStatus(openMovie.movie.id, patch)}
          onClose={() => setOpenMovie(null)} />
      )}
    </main>
  );
}

function buildMap(items: LibraryItem[]) {
  const map: Record<string, Status> = {};
  for (const i of items) {
    if (i.status.watched || i.status.rating != null || i.status.notes || i.status.is_favorite) map[i.movie.id] = i.status;
  }
  return map;
}
