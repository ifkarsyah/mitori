import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useCategoryList } from '@/features/category/hooks'
import { useLanguage } from '@/features/language/useLanguage'
import type { Resource } from './api'
import { useResourceChannelList, useResourceList } from './hooks'
import {
  ALL,
  applyResourceFilters,
  categoryLabel,
  channelLabel,
  topicLabel,
  defaultResourceFilterState,
  distinctCategories,
  distinctChannelIds,
  distinctTopicIds,
  groupResourcesBy,
  type ResourceFilterState,
  type ResourceGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'channel', label: 'Channel' },
  { value: 'category', label: 'Category' },
  { value: 'topic', label: 'Topic' },
]

export function ResourcesDashboardPage() {
  const { language, labelFor } = useLanguage()
  const { data, isLoading, isError, error, refetch } = useResourceList()
  const { data: channels } = useResourceChannelList()
  const { data: categories } = useCategoryList()
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

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of categories ?? []) {
      if (c.name) map.set(c.id, c.name)
    }
    return map
  }, [categories])

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
        key: 'topic',
        header: 'Topic',
        render: (row) =>
          row.category_id != null ? (
            topicLabel(String(row.category_id), categoryNameById)
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        sortValue: (row) =>
          row.category_id != null ? topicLabel(String(row.category_id), categoryNameById) : null,
      },
    ],
    [channelNameById, channelSlugById, categoryNameById],
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
    const values = distinctTopicIds(data ?? [])
    return [
      { value: ALL, label: 'All topics' },
      ...values.map((v) => ({ value: v, label: topicLabel(v, categoryNameById) })),
    ]
  }, [data, categoryNameById])

  const fields: FilterFieldConfig[] = [
    { key: 'channelId', label: 'Channel', options: channelOptions },
    { key: 'category', label: 'Category', options: categoryOptions },
    { key: 'topicId', label: 'Topic', options: contextOptions },
  ]

  const groups = useMemo(() => {
    const filtered = applyResourceFilters(data ?? [], filters)
    return groupResourcesBy(filtered, filters.groupBy, channelNameById, categoryNameById)
  }, [data, filters, channelNameById, categoryNameById])

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
          topicId: filters.topicId,
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
        emptyMessage={
          (data?.length ?? 0) === 0
            ? `No ${labelFor(language)} resources yet.`
            : 'No resources match these filters.'
        }
      />
    </div>
  )
}
