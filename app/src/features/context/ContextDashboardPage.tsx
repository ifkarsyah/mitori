import { useMemo, useState } from 'react'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import type { Context } from '@/features/kotoba/api'
import { useContextList, useContextWordCounts } from './hooks'
import {
  ALL,
  applyContextFilters,
  defaultContextFilterState,
  groupContextsBy,
  kindLabel,
  type ContextFilterState,
  type ContextGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'kind', label: 'Kind' },
  { value: 'none', label: 'None' },
]

const KIND_OPTIONS = [
  { value: ALL, label: 'All kinds' },
  { value: 'concrete', label: kindLabel('concrete') },
  { value: 'abstract', label: kindLabel('abstract') },
]

export function ContextDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useContextList()
  const wordCounts = useContextWordCounts()
  const [filters, setFilters] = useState<ContextFilterState>(defaultContextFilterState)

  const columns = useMemo<ColumnConfig<Context>[]>(
    () => [
      {
        key: 'name',
        header: 'Context',
        render: (row) => <span className="text-lg">{row.name}</span>,
        sortValue: (row) => row.name,
      },
      {
        key: 'kind',
        header: 'Kind',
        render: (row) => (
          <Badge variant={row.kind === 'concrete' ? 'outline' : 'secondary'}>
            {row.kind === 'concrete' ? 'Concrete' : 'Abstract'}
          </Badge>
        ),
        sortValue: (row) => row.kind,
      },
      {
        key: 'words',
        header: 'Words',
        render: (row) => `${wordCounts.get(row.id) ?? 0} words`,
        sortValue: (row) => wordCounts.get(row.id) ?? 0,
      },
    ],
    [wordCounts],
  )

  const fields: FilterFieldConfig[] = [{ key: 'kind', label: 'Kind', options: KIND_OPTIONS }]

  const groups = useMemo(() => {
    const filtered = applyContextFilters(data ?? [], filters)
    return groupContextsBy(filtered, filters.groupBy)
  }, [data, filters])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Context</h1>
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} contexts — where or in what topic vocabulary was encountered
        </p>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search context name…"
        fields={fields}
        fieldValues={{ kind: filters.kind }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as ContextGroupBy }))}
        onClear={() => setFilters(defaultContextFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/context/${row.id}`}
        emptyMessage="No contexts match these filters."
      />
    </div>
  )
}
