export type GroupCount = { key: string; label: string; count: number }

export function GroupCountList({ title, groups }: { title: string; groups: GroupCount[] }) {
  const max = Math.max(1, ...groups.map((g) => g.count))
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      <ul className="flex flex-col gap-1.5">
        {groups.map((g) => (
          <li key={g.key} className="flex items-center gap-2 text-sm">
            <span className="w-40 shrink-0 truncate">{g.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${(g.count / max) * 100}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-muted-foreground">{g.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
