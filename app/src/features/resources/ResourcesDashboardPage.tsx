import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useContextList } from '@/features/kotoba/hooks'
import type { Resource } from './api'
import { useResourceChannelList, useResourceList } from './hooks'
import {
  ALL,
  applyResourceFilters,
  categoryLabel,
  channelLabel,
  contextLabel,
  defaultResourceFilterState,
  distinctCategories,
  distinctChannelIds,
  distinctContextIds,
  groupResourcesBy,
  type ResourceFilterState,
  type ResourceGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'channel', label: 'Channel' },
  { value: 'category', label: 'Category' },
  { value: 'context', label: 'Context' },
]

export function ResourcesDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useResourceList()
  const { data: channels } = useResourceChannelList()
  const { data: contexts } = useContextList()
  const [filters, setFilters] = useState<ResourceFilterState>(defaultResourceFilterState)

  const channelNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of channels ?? []) map.set(c.id, c.name)
    return map
  }, [channels])

  const channelSlugById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of channels ?? []) map.set(c.id, c.slug)
    return map
  }, [channels])

  const contextNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of contexts ?? []) {
      if (c.name) map.set(c.id, c.name)
    }
    return map
  }, [contexts])

  const columns = useMemo<ColumnConfig<Resource>[]>(
    () => [
      {
        key: 'title',
        header: 'Title',
        render: (row) => row.title,
        sortValue: (row) => row.title,
      },
      {
        key: 'channel',
        header: 'Channel',
        render: (row) => {
          if (row.channel_id == null) return <span className="text-muted-foreground">—</span>
          const slug = channelSlugById.get(row.channel_id)
          const label = channelLabel(String(row.channel_id), channelNameById)
          return slug ? (
            <Link
              to={`/resources/channel/${slug}`}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {label}
            </Link>
          ) : (
            label
          )
        },
        sortValue: (row) =>
          row.channel_id != null ? channelLabel(String(row.channel_id), channelNameById) : null,
      },
      {
        key: 'category',
        header: 'Category',
        render: (row) => (row.category ? categoryLabel(row.category) : <span className="text-muted-foreground">—</span>),
        sortValue: (row) => row.category,
      },
      {
        key: 'context',
        header: 'Context',
        render: (row) =>
          row.context_id != null ? (
            contextLabel(String(row.context_id), contextNameById)
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        sortValue: (row) =>
          row.context_id != null ? contextLabel(String(row.context_id), contextNameById) : null,
      },
    ],
    [channelNameById, channelSlugById, contextNameById],
  )

  const channelOptions = useMemo(() => {
    const values = distinctChannelIds(data ?? [])
    return [
      { value: ALL, label: 'All channels' },
      ...values.map((v) => ({ value: v, label: channelLabel(v, channelNameById) })),
    ]
  }, [data, channelNameById])

  const categoryOptions = useMemo(() => {
    const values = distinctCategories(data ?? [])
    return [
      { value: ALL, label: 'All categories' },
      ...values.map((v) => ({ value: v, label: categoryLabel(v) })),
    ]
  }, [data])

  const contextOptions = useMemo(() => {
    const values = distinctContextIds(data ?? [])
    return [
      { value: ALL, label: 'All contexts' },
      ...values.map((v) => ({ value: v, label: contextLabel(v, contextNameById) })),
    ]
  }, [data, contextNameById])

  const fields: FilterFieldConfig[] = [
    { key: 'channelId', label: 'Channel', options: channelOptions },
    { key: 'category', label: 'Category', options: categoryOptions },
    { key: 'contextId', label: 'Context', options: contextOptions },
  ]

  const groups = useMemo(() => {
    const filtered = applyResourceFilters(data ?? [], filters)
    return groupResourcesBy(filtered, filters.groupBy, channelNameById, contextNameById)
  }, [data, filters, channelNameById, contextNameById])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Resources</h1>
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} learning videos from {channels?.length ?? 0} channels
        </p>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search title…"
        fields={fields}
        fieldValues={{
          channelId: filters.channelId,
          category: filters.category,
          contextId: filters.contextId,
        }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as ResourceGroupBy }))}
        onClear={() => setFilters(defaultResourceFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/resources/${row.id}`}
        emptyMessage="No resources match these filters."
      />
    </div>
  )
}
