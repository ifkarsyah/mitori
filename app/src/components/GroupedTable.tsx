import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type ColumnConfig<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export type GroupedTableGroup<T> = { key: string; label: string; rows: T[] }

export type GroupedTableProps<T> = {
  groups: GroupedTableGroup<T>[]
  columns: ColumnConfig<T>[]
  getRowKey: (row: T) => string | number
  getRowHref: (row: T) => string
  emptyMessage?: string
}

export function GroupedTable<T>({
  groups,
  columns,
  getRowKey,
  getRowHref,
  emptyMessage = 'No results.',
}: GroupedTableProps<T>) {
  const navigate = useNavigate()
  const totalRows = groups.reduce((sum, group) => sum + group.rows.length, 0)

  if (totalRows === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {group.label}{' '}
            <span className="text-xs text-muted-foreground/70">({group.rows.length})</span>
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.rows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none"
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
