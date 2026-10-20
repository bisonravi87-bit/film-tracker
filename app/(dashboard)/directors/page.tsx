"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { PersonResult } from "@/lib/types";

interface FollowedDirector { id: string; name: string; profile_path: string | null; watched: number; total: number }

export default function DirectorsPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [msg, setMsg] = useState("");
  const [followed, setFollowed] = useState<FollowedDirector[] | null>(null);

  // Directores guardados: los que tienen películas marcadas por el usuario,
  // con conteo vistas/total de su filmografía cacheada (plan Fase 4).
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setFollowed([]); return; }

      const { data: rows } = await supabase
        .from("user_movie_status")
        .select("movie_id, movie_directors!inner(directors(id, name, profile_path))")
        .eq("user_id", user.id)
        .eq("watched", true);

      const base = new Map<string, FollowedDirector>();
      for (const r of rows ?? []) {
        const md = (r as { movie_directors?: { directors?: FollowedDirector } }).movie_directors;
        const d = md?.directors;
        if (!d?.id) continue;
        const entry = base.get(d.id) ?? { id: d.id, name: d.name, profile_path: d.profile_path, watched: 0, total: 0 };
        entry.watched += 1;
        base.set(d.id, entry);
      }
      const ids = [...base.keys()];
      if (ids.length === 0) { setFollowed([]); return; }

      const { data: rels } = await supabase
        .from("movie_directors")
        .select("director_id, movie_id")
        .in("director_id", ids);

      const totals = new Map<string, number>();
      const seen = new Set<string>();
      for (const rel of rels ?? []) {
        const key = `${rel.director_id}:${rel.movie_id}`;
        if (!seen.has(key)) { seen.add(key); totals.set(rel.director_id, (totals.get(rel.director_id) ?? 0) + 1); }
      }
      setFollowed([...base.values()]
        .map((d) => ({ ...d, total: totals.get(d.id) ?? 0 }))
        .sort((a, b) => b.watched / Math.max(1, b.total) - a.watched / Math.max(1, a.total)));
    })();
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); setMsg(""); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); return; }
      setResults(data);
      setMsg(data.length ? "" : "Sin resultados. Prueba con otro nombre.");
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">¿De qué director quieres completar la filmografía?</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Stanley Kubrick, Agnès Varda, Bong Joon-ho…"
        aria-label="Buscar director" className="w-full max-w-xl rounded-sm border border-line bg-white px-4 py-3" />
      {msg && <p className="text-sm text-slate2">{msg}</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {results.map((p) => (
          <li key={p.id}>
            <Link href={`/directors/${p.id}`} className="flex items-center gap-3 rounded-sm border border-line bg-white p-3 hover:border-ink">
              {p.profile_path
                ? <Image src={`https://image.tmdb.org/t/p/w92${p.profile_path}`} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                : <span className="h-12 w-12 rounded-full bg-line" />}
              <span className="font-medium">{p.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      {followed && followed.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-t border-line pt-6 text-lg font-bold">Directores en seguimiento</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {followed.map((d) => (
              <li key={d.id}>
                <Link href={`/directors/${d.id}`} className="flex items-center gap-3 rounded-sm border border-line bg-white p-3 hover:border-ink">
                  {d.profile_path
                    ? <Image src={`https://image.tmdb.org/t/p/w92${d.profile_path}`} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    : <span className="h-10 w-10 rounded-full bg-line" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="text-xs text-slate2">{d.watched} / {d.total} vistas</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
