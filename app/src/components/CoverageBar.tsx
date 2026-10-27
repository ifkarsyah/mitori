export function CoverageBar({ covered, total }: { covered: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((covered / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm tabular-nums">
        {covered}
        <span className="text-muted-foreground">/{total}</span>
      </span>
    </div>
  )
}
