import Link from "next/link";

export default function NotFound() {
  return (
    <main className="space-y-4 py-12">
      <h1 className="text-2xl font-bold">Género no encontrado</h1>
      <p className="text-sm text-slate2">Ese slug no existe entre los géneros y estilos siembrados.</p>
      <Link href="/genres" className="underline hover:text-stamp">Volver a géneros</Link>
    </main>
  );
}
