import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, type NavigateFunction } from 'react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
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

// Groups larger than this are row-virtualized instead of rendered in full —
// keeps the DOM light as tables grow into the thousands of rows.
const VIRTUALIZE_THRESHOLD = 50
const ROW_HEIGHT_ESTIMATE = 41
const VIRTUAL_CONTAINER_HEIGHT = 600

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

function GroupTable<T>({
  rows,
  columns,
  sortState,
  toggleSort,
  getRowKey,
  getRowHref,
  navigate,
}: {
  rows: T[]
  columns: ColumnConfig<T>[]
  sortState: SortState
  toggleSort: (column: ColumnConfig<T>) => void
  getRowKey: (row: T) => string | number
  getRowHref: (row: T) => string
  navigate: NavigateFunction
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldVirtualize = rows.length > VIRTUALIZE_THRESHOLD

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 10,
    enabled: shouldVirtualize,
  })

  function buildHeaderRow(sticky: boolean) {
    return (
    <TableRow>
      {columns.map((column) => {
        const isSortable = !!column.sortValue
        const isActive = sortState?.key === column.key
        return (
          <TableHead
            key={column.key}
            className={cn(column.className, sticky && 'sticky top-0 z-10 bg-background')}
          >
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
    )
  }

  function renderRow(row: T, measureRef?: (node: Element | null) => void, dataIndex?: number) {
    return (
      <TableRow
        key={getRowKey(row)}
        ref={measureRef}
        data-index={dataIndex}
        role="link"
        tabIndex={0}
        className={cn('cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none')}
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
    )
  }

  if (!shouldVirtualize) {
    return (
      <Table>
        <TableHeader>{buildHeaderRow(false)}</TableHeader>
        <TableBody>{rows.map((row) => renderRow(row))}</TableBody>
      </Table>
    )
  }

  const virtualItems = virtualizer.getVirtualItems()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom =
    virtualItems.length > 0 ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0

  return (
    <div ref={scrollRef} className="overflow-auto rounded-md border" style={{ maxHeight: VIRTUAL_CONTAINER_HEIGHT }}>
      {/* Raw table, not the <Table> wrapper: its own overflow-x-auto div would become an
          intermediate scroll container and break the sticky header's positioning reference. */}
      <table className="w-full caption-bottom text-sm">
        <TableHeader>{buildHeaderRow(true)}</TableHeader>
        <TableBody>
          {paddingTop > 0 && (
            <tr aria-hidden="true">
              <td style={{ height: paddingTop }} colSpan={columns.length} />
            </tr>
          )}
          {virtualItems.map((virtualRow) =>
            renderRow(rows[virtualRow.index], virtualizer.measureElement, virtualRow.index),
          )}
          {paddingBottom > 0 && (
            <tr aria-hidden="true">
              <td style={{ height: paddingBottom }} colSpan={columns.length} />
            </tr>
          )}
        </TableBody>
      </table>
    </div>
  )
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
          <GroupTable
            rows={group.rows}
            columns={columns}
            sortState={sortState}
            toggleSort={toggleSort}
            getRowKey={getRowKey}
            getRowHref={getRowHref}
            navigate={navigate}
          />
        </section>
      ))}
    </div>
  )
}
