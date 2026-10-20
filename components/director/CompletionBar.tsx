export default function CompletionBar({ watched, total }: { watched: number; total: number }) {
  const pct = total ? Math.round((watched / total) * 100) : 0;
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Filmografía vista">
      <div className="flex items-baseline justify-between text-sm">
        <span>{watched} de {total} películas vistas</span>
        <span className="text-2xl font-bold">{pct}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-sm bg-line">
        <div className="h-full bg-stamp transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
