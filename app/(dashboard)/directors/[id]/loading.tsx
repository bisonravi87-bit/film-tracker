export default function Loading() {
  return (
    <main className="space-y-8" aria-busy="true" aria-label="Cargando filmografía">
      <div className="flex items-center gap-5">
        <div className="h-24 w-24 animate-pulse rounded-full bg-line" />
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-sm bg-line" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-sm bg-line" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[2/3] animate-pulse rounded-sm bg-line" />
            <div className="h-4 w-3/4 animate-pulse rounded-sm bg-line" />
          </div>
        ))}
      </div>
    </main>
  );
}
