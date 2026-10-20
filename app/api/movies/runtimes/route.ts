import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getMovieDetails } from "@/lib/tmdb";

/**
 * Completa `runtime` de las películas vistas a las que falta (el endpoint
 * `movie_credits` no devuelve duración; se pide el detalle bajo demanda).
 * Procesa un lote por llamada para no superar los límites de TMDB.
 */
export async function POST() {
  const batchSize = 25;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { data: watched } = await supabase
    .from("user_movie_status")
    .select("movie_id, movies(runtime)")
    .eq("user_id", user.id)
    .eq("watched", true);

  const pending = ((watched ?? []) as unknown as Array<{ movie_id: string; movies: { runtime: number | null } | null }>)
    .filter((r) => r.movies?.runtime == null)
    .map((r) => r.movie_id)
    .slice(0, batchSize);

  if (pending.length === 0) return NextResponse.json({ updated: 0, batchSize });

  const admin = createAdminClient();
  let updated = 0;
  for (const id of pending) {
    const detail = await getMovieDetails(id).catch(() => null);
    if (!detail) continue;
    const { error } = await admin.from("movies").update({ runtime: detail.runtime }).eq("id", id);
    if (!error) updated += 1;
  }
  return NextResponse.json({ updated, batchSize });
}
