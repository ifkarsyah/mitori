import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ToggleableColumn = { key: string; label: string }

export type ColumnVisibilityToggleProps = {
  columns: ToggleableColumn[]
  hiddenKeys: Set<string>
  onToggle: (key: string) => void
}

export function ColumnVisibilityToggle({
  columns,
  hiddenKeys,
  onToggle,
}: ColumnVisibilityToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Columns:</span>
      {columns.map((column) => {
        const hidden = hiddenKeys.has(column.key)
        return (
          <Button
            key={column.key}
            type="button"
            size="xs"
            variant={hidden ? 'outline' : 'secondary'}
            className={cn(hidden && 'text-muted-foreground')}
            onClick={() => onToggle(column.key)}
          >
            {column.label}
          </Button>
        )
      })}
    </div>
  )
}
