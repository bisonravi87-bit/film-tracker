import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CompletionBar from "@/components/director/CompletionBar";

interface GenreProgressRow { genre_id: number; name: string; slug: string; is_custom: boolean; total: number; watched: number }

export default async function GenresPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("genre_progress");
  const rows = (data ?? []) as unknown as GenreProgressRow[];

  if (error) {
    return (
      <main className="space-y-4">
        <h1 className="text-3xl font-bold">Géneros y estilos</h1>
        <p className="rounded-sm border border-line bg-white p-3 text-sm text-slate2">
          Falta la función de progreso. Ejecuta <code>supabase/functions.sql</code> en el SQL Editor de Supabase y siembra
          datos con <code>npm run seed:all</code>.
        </p>
      </main>
    );
  }

  const custom = rows.filter((g) => g.is_custom);
  const canonical = rows.filter((g) => !g.is_custom);

  return (
    <main className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Géneros y estilos</h1>
        <p className="mt-2 text-sm text-slate2">
          Tu porcentaje en cada uno. Los géneros agrupan las 150 películas más votadas de TMDB; los estilos curados se
          rellenan con <code>scripts/curated-styles.json</code>.
        </p>
      </div>

      {custom.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Estilos curados</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((g) => (
              <li key={g.genre_id} className="rounded-sm border border-line bg-white p-4">
                <Link href={`/genres/${g.slug}`} className="text-lg font-bold hover:text-stamp">{g.name}</Link>
                <div className="mt-3"><CompletionBar watched={g.watched} total={g.total} /></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className={`${custom.length ? "border-t border-line pt-8 " : ""}text-lg font-bold`}>Géneros TMDB</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canonical.map((g) => (
            <li key={g.genre_id} className="rounded-sm border border-line bg-white p-4">
              <Link href={`/genres/${g.slug}`} className="text-lg font-bold hover:text-stamp">{g.name}</Link>
              <div className="mt-3"><CompletionBar watched={g.watched} total={g.total} /></div>
            </li>
          ))}
        </ul>
      </section>

      {rows.length === 0 && (
        <p className="text-sm text-slate2">No hay géneros sembrados todavía. Ejecuta <code>npm run seed:genres</code>.</p>
      )}
    </main>
  );
}
