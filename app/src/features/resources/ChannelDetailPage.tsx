import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useContextList } from '@/features/kotoba/hooks'
import type { Resource } from './api'
import {
  ALL,
  applyResourceFilters,
  categoryLabel,
  contextLabel,
  defaultResourceFilterState,
  distinctCategories,
  distinctContextIds,
  groupResourcesBy,
  type ResourceFilterState,
  type ResourceGroupBy,
} from './filters'
import { useResourceChannelBySlug, useResourcesForChannel } from './hooks'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'category', label: 'Category' },
  { value: 'context', label: 'Context' },
]

export function ChannelDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: channel, isLoading, isError, error, refetch } = useResourceChannelBySlug(slug)
  const { data: resources, isLoading: resourcesLoading } = useResourcesForChannel(channel?.id)
  const { data: contexts } = useContextList()
  const [filters, setFilters] = useState<ResourceFilterState>(defaultResourceFilterState)

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
    [contextNameById],
  )

  const categoryOptions = useMemo(() => {
    const values = distinctCategories(resources)
    return [
      { value: ALL, label: 'All categories' },
      ...values.map((v) => ({ value: v, label: categoryLabel(v) })),
    ]
  }, [resources])

  const contextOptions = useMemo(() => {
    const values = distinctContextIds(resources)
    return [
      { value: ALL, label: 'All contexts' },
      ...values.map((v) => ({ value: v, label: contextLabel(v, contextNameById) })),
    ]
  }, [resources, contextNameById])

  const fields: FilterFieldConfig[] = [
    { key: 'category', label: 'Category', options: categoryOptions },
    { key: 'contextId', label: 'Context', options: contextOptions },
  ]

  const groups = useMemo(() => {
    const filtered = applyResourceFilters(resources, filters)
    return groupResourcesBy(filtered, filters.groupBy, new Map(), contextNameById)
  }, [resources, filters, contextNameById])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!channel) return <p className="py-12 text-center text-muted-foreground">Channel not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/resources" />} nativeButton={false} className="w-fit">
        ← Back to resources
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{channel.name}</span>
          <Badge variant="outline">{channel.platform === 'tiktok' ? 'TikTok' : 'YouTube'}</Badge>
        </div>
        {channel.url && (
          <a
            className="w-fit text-sm text-primary underline underline-offset-4"
            href={channel.url}
            target="_blank"
            rel="noreferrer"
          >
            {channel.url}
          </a>
        )}
        {channel.description && (
          <p className="max-w-2xl whitespace-pre-line text-sm text-muted-foreground">{channel.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {resources.length} video{resources.length === 1 ? '' : 's'}
        </p>
      </div>

      {resourcesLoading ? (
        <LoadingState />
      ) : (
        <>
          <FilterBar
            search={filters.search}
            onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
            searchPlaceholder="Search title…"
            fields={fields}
            fieldValues={{ category: filters.category, contextId: filters.contextId }}
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
            emptyMessage="No videos match these filters."
          />
        </>
      )}
    </div>
  )
}
