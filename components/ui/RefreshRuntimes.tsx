"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Botón que pide al servidor completar `runtime` de películas vistas (falta el dato, plan Fase 4). */
export default function RefreshRuntimes({ missing }: { missing: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  async function run() {
    setBusy(true);
    let total = 0;
    for (;;) {
      const res = await fetch("/api/movies/runtimes", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.updated) break;
      total += data.updated;
      if (data.updated < data.batchSize) break;
    }
    setDone(total);
    setBusy(false);
    if (total > 0) router.refresh();
  }

  return (
    <button type="button" onClick={run} disabled={busy}
      className="rounded-sm border border-line bg-white px-3 py-2 text-sm hover:border-ink disabled:opacity-60">
      {busy ? `Actualizando duración… (${done}/${missing})` : `Calcular duración de ${missing} vistas`}
    </button>
  );
}
