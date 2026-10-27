import { useMemo } from 'react'
import { Link } from 'react-router'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { CoverageBar } from '@/components/CoverageBar'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useLanguage } from '@/features/language/useLanguage'
import type { Scene } from './api'
import { useSceneCounts, useSceneList, useSceneLookup } from './hooks'

/** Each top-level scene followed by the scenes narrowing it. */
function treeOrder(scenes: Scene[]): Scene[] {
  const ids = new Set(scenes.map((s) => s.id))
  const roots = scenes.filter((s) => s.parent_id == null || !ids.has(s.parent_id))
  return roots.flatMap((root) => [root, ...scenes.filter((s) => s.parent_id === root.id)])
}

export function SceneDashboardPage() {
  const { current } = useLanguage()
  const { data, isLoading, isError, error, refetch } = useSceneList()
  const sceneById = useSceneLookup()
  const counts = useSceneCounts()
  const languageName = current?.name ?? 'this language'

  const groups = useMemo(() => {
    const list = data ?? []
    return [
      { key: 'general', label: 'Everywhere', rows: treeOrder(list.filter((s) => s.language == null)) },
      { key: 'language', label: `Only in ${languageName}`, rows: treeOrder(list.filter((s) => s.language != null)) },
    ].filter((g) => g.rows.length > 0)
  }, [data, languageName])

  const columns = useMemo<ColumnConfig<Scene>[]>(
    () => [
      {
        key: 'name',
        header: 'Scene',
        render: (row) => {
          const parent = row.parent_id != null ? sceneById.get(row.parent_id) : undefined
          return (
            <span className={parent ? 'pl-4' : undefined}>
              <Link to={`/scene/${row.slug}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                {row.name}
              </Link>
              {parent && row.language != null && (
                <span className="text-sm text-muted-foreground"> · in {parent.name}</span>
              )}
            </span>
          )
        },
        sortValue: (row) => row.name,
      },
      {
        key: 'description',
        header: 'Description',
        render: (row) => <span className="text-muted-foreground">{row.description ?? '—'}</span>,
      },
      {
        key: 'meanings',
        header: `${languageName} words`,
        render: (row) => {
          const c = counts.get(row.id)
          return <CoverageBar covered={c?.covered ?? 0} total={c?.meanings ?? 0} />
        },
        sortValue: (row) => counts.get(row.id)?.meanings ?? 0,
      },
      {
        key: 'phrases',
        header: 'Phrases',
        render: (row) => counts.get(row.id)?.phrases ?? 0,
        sortValue: (row) => counts.get(row.id)?.phrases ?? 0,
      },
      {
        key: 'sentences',
        header: 'Sentences',
        render: (row) => counts.get(row.id)?.sentences ?? 0,
        sortValue: (row) => counts.get(row.id)?.sentences ?? 0,
      },
    ],
    [counts, sceneById, languageName],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Scene</h1>
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} real-world places, with the words, set phrases and sentences you need there.
        </p>
      </div>

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/scene/${row.slug}`}
        emptyMessage="No scenes yet."
      />
    </div>
  )
}
