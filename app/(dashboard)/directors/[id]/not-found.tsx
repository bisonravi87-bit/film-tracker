import Link from "next/link";

export default function NotFound() {
  return (
    <main className="space-y-4 py-12">
      <h1 className="text-2xl font-bold">Director no encontrado</h1>
      <p className="text-sm text-slate2">No existe esa ficha en TMDB o el enlace es antiguo.</p>
      <Link href="/directors" className="underline hover:text-stamp">Volver a directores</Link>
    </main>
  );
}
