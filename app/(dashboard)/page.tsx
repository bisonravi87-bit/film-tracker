import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import RefreshRuntimes from "@/components/ui/RefreshRuntimes";

interface GenreProgressRow { genre_id: number; name: string; slug: string; is_custom: boolean; total: number; watched: number }
interface DirectorProgressRow { director_id: string; name: string; profile_path: string | null; total: number; watched: number }
interface ActivityRow { updated_at: string; watched: boolean; rating: number | null; movies: { title: string; release_year: number | null } | null }

export default async function DashboardPage() {
  const supabase = await createClient();

  const [totals, favs, recent, genres, directors] = await Promise.all([
    // Totales: películas vistas y horas (con runtime ya completado; el resto a 0).
    supabase.from("user_movie_status").select("movie_id, movies(runtime)")
      .eq("watched", true),
    supabase.from("user_movie_status").select("movie_id").eq("is_favorite", true),
    // Actividad reciente (últimas 10 filas por updated_at).
    supabase.from("user_movie_status").select("updated_at, watched, rating, movies(title, release_year)")
      .order("updated_at", { ascending: false }).limit(10),
    supabase.rpc("genre_progress"),
    supabase.rpc("director_progress"),
  ]);

  const watchedRows = (totals.data ?? []) as unknown as Array<{ movies: { runtime: number | null } | null }>;
  const watchedCount = watchedRows.length;
  const minutes = watchedRows.reduce((sum, r) => sum + (r.movies?.runtime ?? 0), 0);
  const favoriteCount = (favs.data ?? []).length;
  const pct = (d: DirectorProgressRow) => (d.total ? Math.round((d.watched / d.total) * 100) : 0);
  const allGenres = (genres.data ?? []) as unknown as GenreProgressRow[];
  const nextGenre = allGenres.filter((g) => g.total > g.watched)
    .sort((a, b) => b.watched / b.total - a.watched / a.total)[0];
  const genrePct = (g: GenreProgressRow) => (g.total ? Math.round((g.watched / g.total) * 100) : 0);

  const missingRuntimes = watchedRows.filter((r) => r.movies?.runtime == null).length;
  const genreRpcError = genres.error;
  const activity = (recent.data ?? []) as unknown as ActivityRow[];
  const topDirectors = ((directors.data ?? []) as unknown as DirectorProgressRow[]).sort((a, b) => pct(b) - pct(a)).slice(0, 6);
  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Tu progreso</h1>
        {missingRuntimes > 0 && <RefreshRuntimes missing={missingRuntimes} />}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Películas vistas" value={watchedCount} />
        <StatCard label="Horas vistas" value={Math.floor(minutes / 60)} hint={missingRuntimes > 0 ? `${missingRuntimes} pendientes de duración` : undefined} />
        <StatCard label="Favoritas" value={favoriteCount} />
        <StatCard label="Directores en seguimiento" value={(directors.data ?? []).length} />
      </section>

      {(directors.error || genreRpcError) && (
        <p className="rounded-sm border border-line bg-white p-3 text-sm text-slate2">
          Para ver directores y géneros con porcentaje, ejecuta <code>supabase/functions.sql</code> en el SQL Editor de Supabase.
        </p>
      )}

      {topDirectors.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Directores con más progreso</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topDirectors.map((d) => (
              <li key={d.director_id}>
                <Link href={`/directors/${d.director_id}`} className="flex items-center gap-3 rounded-sm border border-line bg-white p-3 hover:border-ink">
                  {d.profile_path
                    ? <Image src={`https://image.tmdb.org/t/p/w92${d.profile_path}`} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    : <span className="h-10 w-10 rounded-full bg-line" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="text-xs text-slate2">{d.watched} / {d.total} vistas</span>
                  </span>
                  <span className="text-lg font-bold">{pct(d)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nextGenre && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold">Sigue tachando</h2>
          <p className="text-sm text-slate2">
            El género más avanzado pendiente es{" "}
            <Link href={`/genres/${nextGenre.slug}`} className="font-medium underline hover:text-stamp">{nextGenre.name}</Link>{" "}
            ({nextGenre.watched} de {nextGenre.total}, {genrePct(nextGenre)}%).
          </p>
        </section>
      )}

      {activity.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Actividad reciente</h2>
          <ul className="divide-y divide-line rounded-sm border border-line bg-white">
            {activity.map((r, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {r.movies?.title ?? "—"}{" "}
                  {r.movies?.release_year ? <span className="text-slate2">({r.movies.release_year})</span> : null}
                </span>
                <span className="shrink-0 text-xs text-slate2">
                  {r.watched ? "Vista" : "Actualizada"}{r.rating ? ` · ${r.rating}/10` : ""} · {formatDate(r.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {watchedCount === 0 && (
        <p className="text-sm text-slate2">Aún no has marcado películas.{" "}
          <Link href="/directors" className="underline hover:text-stamp">Busca un director</Link> y empieza a tachar.</p>
      )}
    </main>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-sm border border-line bg-white p-4">
      <p className="text-sm text-slate2">{label}</p>
      <p className="text-3xl font-bold">{value}{hint && <span className="ml-2 text-xs font-normal text-slate2">{hint}</span>}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
