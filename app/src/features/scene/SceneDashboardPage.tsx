import { useMemo } from 'react'
import { Link } from 'react-router'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useCategoryLookup } from '@/features/category/hooks'
import { useLanguage } from '@/features/language/useLanguage'
import type { Scene } from './api'
import { useSceneCounts, useSceneList } from './hooks'

export function SceneDashboardPage() {
  const { current } = useLanguage()
  const { data, isLoading, isError, error, refetch } = useSceneList()
  const categories = useCategoryLookup()
  const counts = useSceneCounts()

  // Grouped by the general category each scene narrows; the rest exist only
  // in this language and have no general counterpart.
  const groups = useMemo(() => {
    const byKey = new Map<string, { key: string; label: string; rows: Scene[] }>()
    for (const scene of data ?? []) {
      const category = scene.category_id != null ? categories.byId.get(scene.category_id) : undefined
      const key = category ? String(category.id) : 'none'
      const label = category?.name ?? `Only in ${current?.name ?? 'this language'}`
      const group = byKey.get(key)
      if (group) group.rows.push(scene)
      else byKey.set(key, { key, label, rows: [scene] })
    }
    return [...byKey.values()]
  }, [data, categories, current])

  const columns = useMemo<ColumnConfig<Scene>[]>(
    () => [
      {
        key: 'name',
        header: 'Scene',
        render: (row) => (
          <Link to={`/scene/${row.slug}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {row.name}
          </Link>
        ),
        sortValue: (row) => row.name,
      },
      {
        key: 'description',
        header: 'Description',
        render: (row) => <span className="text-muted-foreground">{row.description ?? '—'}</span>,
      },
      {
        key: 'words',
        header: 'Words',
        render: (row) => counts.get(row.id)?.words ?? 0,
        sortValue: (row) => counts.get(row.id)?.words ?? 0,
      },
      {
        key: 'phrases',
        header: 'Phrases',
        render: (row) => counts.get(row.id)?.phrases ?? 0,
        sortValue: (row) => counts.get(row.id)?.phrases ?? 0,
      },
    ],
    [counts],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Scene</h1>
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} situations specific to {current?.name ?? 'this language'}, with the words and set
          phrases they call for.
        </p>
      </div>

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/scene/${row.slug}`}
        emptyMessage={`No ${current?.name ?? ''} scenes yet.`}
      />
    </div>
  )
}
