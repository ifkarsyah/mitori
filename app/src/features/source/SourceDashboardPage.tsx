import { useMemo, useState } from 'react'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import type { Source } from '@/features/kotoba/api'
import { useContextList } from '@/features/kotoba/hooks'
import { useSourceList, useSourceWordCounts } from './hooks'
import {
  ALL,
  applySourceFilters,
  defaultSourceFilterState,
  distinctSourceContextIds,
  groupSourcesBy,
  sourceContextLabel,
  type SourceFilterState,
  type SourceGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'context', label: 'Context' },
]

export function SourceDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useSourceList()
  const { data: contexts } = useContextList()
  const wordCounts = useSourceWordCounts()
  const [filters, setFilters] = useState<SourceFilterState>(defaultSourceFilterState)

  const contextNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of contexts ?? []) {
      if (c.name) map.set(c.id, c.name)
    }
    return map
  }, [contexts])

  const columns = useMemo<ColumnConfig<Source>[]>(
    () => [
      {
        key: 'name',
        header: 'Source',
        render: (row) => <span className="text-lg">{row.name}</span>,
        sortValue: (row) => row.name,
      },
      {
        key: 'url',
        header: 'URL',
        render: (row) => row.url ?? <span className="text-muted-foreground">—</span>,
        sortValue: (row) => row.url,
      },
      {
        key: 'context',
        header: 'Context',
        render: (row) =>
          row.context_id != null ? (
            sourceContextLabel(String(row.context_id), contextNameById)
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        sortValue: (row) =>
          row.context_id != null ? sourceContextLabel(String(row.context_id), contextNameById) : null,
      },
      {
        key: 'words',
        header: 'Words',
        render: (row) => `${wordCounts.get(row.id) ?? 0} words`,
        sortValue: (row) => wordCounts.get(row.id) ?? 0,
      },
    ],
    [wordCounts, contextNameById],
  )

  const contextOptions = useMemo(() => {
    const values = distinctSourceContextIds(data ?? [])
    return [
      { value: ALL, label: 'All contexts' },
      ...values.map((v) => ({ value: v, label: sourceContextLabel(v, contextNameById) })),
    ]
  }, [data, contextNameById])

  const fields: FilterFieldConfig[] = [{ key: 'contextId', label: 'Context', options: contextOptions }]

  const groups = useMemo(() => {
    const filtered = applySourceFilters(data ?? [], filters)
    return groupSourcesBy(filtered, filters.groupBy, contextNameById)
  }, [data, filters, contextNameById])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Source</h1>
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} sources — the specific place a word was actually found
        </p>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search source name or URL…"
        fields={fields}
        fieldValues={{ contextId: filters.contextId }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as SourceGroupBy }))}
        onClear={() => setFilters(defaultSourceFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/source/${row.id}`}
        emptyMessage="No sources match these filters."
      />
    </div>
  )
}
