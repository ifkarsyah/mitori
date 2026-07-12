import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type ColumnConfig<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  /** Value to compare when sorting by this column. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number | null
}

export type GroupedTableGroup<T> = { key: string; label: string; rows: T[] }

export type GroupedTableProps<T> = {
  groups: GroupedTableGroup<T>[]
  columns: ColumnConfig<T>[]
  getRowKey: (row: T) => string | number
  getRowHref: (row: T) => string
  emptyMessage?: string
}

type SortDirection = 'asc' | 'desc'
type SortState = { key: string; direction: SortDirection } | null

function sortRows<T>(rows: T[], column: ColumnConfig<T> | undefined, direction: SortDirection): T[] {
  if (!column?.sortValue) return rows
  const sortValue = column.sortValue
  return [...rows].sort((a, b) => {
    const va = sortValue(a)
    const vb = sortValue(b)
    if (va == null && vb == null) return 0
    if (va == null) return 1 // nulls last regardless of direction
    if (vb == null) return -1
    let cmp: number
    if (typeof va === 'number' && typeof vb === 'number') {
      cmp = va - vb
    } else {
      cmp = String(va).localeCompare(String(vb))
    }
    return direction === 'asc' ? cmp : -cmp
  })
}

export function GroupedTable<T>({
  groups,
  columns,
  getRowKey,
  getRowHref,
  emptyMessage = 'No results.',
}: GroupedTableProps<T>) {
  const navigate = useNavigate()
  const [sortState, setSortState] = useState<SortState>(null)
  const totalRows = groups.reduce((sum, group) => sum + group.rows.length, 0)

  const sortedGroups = useMemo(() => {
    if (!sortState) return groups
    const column = columns.find((c) => c.key === sortState.key)
    return groups.map((group) => ({ ...group, rows: sortRows(group.rows, column, sortState.direction) }))
  }, [groups, columns, sortState])

  if (totalRows === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  function toggleSort(column: ColumnConfig<T>) {
    if (!column.sortValue) return
    setSortState((prev) => {
      if (prev?.key !== column.key) return { key: column.key, direction: 'asc' }
      return { key: column.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {sortedGroups.map((group) => (
        <section key={group.key}>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {group.label}{' '}
            <span className="text-xs text-muted-foreground/70">({group.rows.length})</span>
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => {
                  const isSortable = !!column.sortValue
                  const isActive = sortState?.key === column.key
                  return (
                    <TableHead key={column.key} className={column.className}>
                      {isSortable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={() => toggleSort(column)}
                        >
                          {column.header}
                          {isActive ? (
                            sortState.direction === 'asc' ? (
                              <ArrowUp className="size-3.5" />
                            ) : (
                              <ArrowDown className="size-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.rows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  role="link"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none',
                  )}
                  onClick={() => navigate(getRowHref(row))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(getRowHref(row))
                    }
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ))}
    </div>
  )
}
