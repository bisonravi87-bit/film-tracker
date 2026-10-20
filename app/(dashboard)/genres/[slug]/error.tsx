"use client";

export default function GenreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="space-y-4 py-12" role="alert">
      <h1 className="text-2xl font-bold">No se pudo cargar el género</h1>
      <p className="text-sm text-slate2">Problema al leer la base de datos. Comprueba tu conexión y reintenta.</p>
      <button type="button" onClick={reset} className="rounded-sm bg-ink px-4 py-2 text-paper hover:bg-stamp">
        Reintentar
      </button>
    </main>
  );
}
