"use client";
import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EMPTY_STATUS, type Status, type StatusMap } from "@/lib/types";

/**
 * Estado de usuario por película + guardado optimista en Supabase.
 * Un solo punto de guardado: aplica el cambio en local, hace upsert con los
 * campos cambiados, y si vuelve a fallar restaura el estado anterior.
 */
export function useMovieStatuses(initial: StatusMap) {
  const [statuses, setStatuses] = useState<StatusMap>(() => initial ?? {});
  const [error, setError] = useState("");

  const saveStatus = useCallback(async (movieId: string, patch: Partial<Status>) => {
    const prev = statuses[movieId];
    setStatuses((s) => ({ ...s, [movieId]: { ...EMPTY_STATUS, ...s[movieId], ...patch } }));
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const row: Record<string, unknown> = {
      user_id: user?.id,
      movie_id: movieId,
      updated_at: new Date().toISOString(),
      ...patch,
    };
    if (patch.watched !== undefined) {
      row.watched_at = patch.watched ? new Date().toISOString() : null;
    }
    const { error: upsertError } = await supabase.from("user_movie_status").upsert(row);
    if (upsertError) {
      setStatuses((s) => {
        const next = { ...s };
        if (prev) next[movieId] = prev; else delete next[movieId];
        return next;
      });
      setError("No se pudo guardar el cambio. Comprueba tu conexión e inténtalo de nuevo.");
    }
  }, [statuses]);

  const toggleWatched = useCallback(
    (movieId: string) => saveStatus(movieId, { watched: !statuses[movieId]?.watched }),
    [saveStatus, statuses],
  );

  return { statuses, saveStatus, toggleWatched, error };
}
