"use client";

export default function DirectorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="space-y-4 py-12" role="alert">
      <h1 className="text-2xl font-bold">No se pudo cargar la filmografía</h1>
      <p className="text-sm text-slate2">
        Puede que TMDB no haya respondido o que el director no exista.{" "}
        {error.digest && <span className="text-xs"> (ref. {error.digest})</span>}
      </p>
      <button type="button" onClick={reset} className="rounded-sm bg-ink px-4 py-2 text-paper hover:bg-stamp">
        Reintentar
      </button>
    </main>
  );
}
