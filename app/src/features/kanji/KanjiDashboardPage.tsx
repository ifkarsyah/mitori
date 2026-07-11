import { useMemo, useState } from 'react'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { useKanjiList, useKanjiUsageCounts } from './hooks'
import type { Kanji } from './api'
import {
  ALL,
  applyKanjiFilters,
  defaultKanjiFilterState,
  distinctFieldValues,
  gradeLabel,
  groupKanjiBy,
  jlptLabel,
  type KanjiFilterState,
  type KanjiGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'grade', label: 'Grade' },
  { value: 'jlpt', label: 'JLPT' },
]

export function KanjiDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useKanjiList()
  const usageCounts = useKanjiUsageCounts()
  const [filters, setFilters] = useState<KanjiFilterState>(defaultKanjiFilterState)

  const columns = useMemo<ColumnConfig<Kanji>[]>(
    () => [
      {
        key: 'character',
        header: 'Kanji',
        render: (row) => <span className="text-lg">{row.character}</span>,
      },
      {
        key: 'grade',
        header: 'Grade',
        render: (row) =>
          row.grade ? gradeLabel(row.grade) : <span className="text-muted-foreground">—</span>,
      },
      {
        key: 'jlpt',
        header: 'JLPT',
        render: (row) =>
          row.jlpt ? jlptLabel(row.jlpt) : <span className="text-muted-foreground">—</span>,
      },
      {
        key: 'usage',
        header: 'Used in',
        render: (row) => `${usageCounts.get(row.id) ?? 0} words`,
      },
      {
        key: 'meanings',
        header: 'Meanings',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {(row.meanings ?? []).slice(0, 3).map((meaning) => (
              <Badge key={meaning} variant="secondary">
                {meaning}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    [usageCounts],
  )

  const gradeOptions = useMemo(() => {
    const values = distinctFieldValues(data ?? [], 'grade')
    return [
      { value: ALL, label: 'All grades' },
      ...values.map((v) => ({ value: v, label: gradeLabel(v) })),
    ]
  }, [data])

  const jlptOptions = useMemo(() => {
    const values = distinctFieldValues(data ?? [], 'jlpt')
    return [
      { value: ALL, label: 'All JLPT levels' },
      ...values.map((v) => ({ value: v, label: jlptLabel(v) })),
    ]
  }, [data])

  const fields: FilterFieldConfig[] = [
    { key: 'grade', label: 'Grade', options: gradeOptions },
    { key: 'jlpt', label: 'JLPT', options: jlptOptions },
  ]

  const groups = useMemo(() => {
    const filtered = applyKanjiFilters(data ?? [], filters)
    return groupKanjiBy(filtered, filters.groupBy)
  }, [data, filters])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Kanji</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} kanji total</p>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search character or meaning…"
        fields={fields}
        fieldValues={{ grade: filters.grade, jlpt: filters.jlpt }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as KanjiGroupBy }))}
        onClear={() => setFilters(defaultKanjiFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/kanji/${row.id}`}
        emptyMessage="No kanji match these filters."
      />
    </div>
  )
}
