import { useMemo } from 'react'
import { Link } from 'react-router'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { CoverageBar } from '@/components/CoverageBar'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useLanguage } from '@/features/language/useLanguage'
import type { Scene } from './api'
import { useSceneCounts, useSceneList } from './hooks'

type SceneRow = Scene & { depth: number }

/** A scene's descendants, each followed by its own, with depth from 1. */
function descendants(scenes: Scene[], parentId: number, depth = 1): SceneRow[] {
  return scenes
    .filter((s) => s.parent_id === parentId)
    .flatMap((s) => [{ ...s, depth }, ...descendants(scenes, s.id, depth + 1)])
}

export function SceneDashboardPage() {
  const { current } = useLanguage()
  const { data, isLoading, isError, error, refetch } = useSceneList()
  const counts = useSceneCounts()
  const languageName = current?.name ?? 'this language'

  // One section per top-level scene that groups others (Daily needs, Online);
  // top-level scenes with nothing under them share a final section.
  const groups = useMemo(() => {
    const list = data ?? []
    const roots = list.filter((s) => s.parent_id == null)
    const sections = roots
      .map((root) => ({ key: root.slug, label: root.name, rows: descendants(list, root.id) }))
      .filter((g) => g.rows.length > 0)
    const loose = roots.filter((r) => !list.some((s) => s.parent_id === r.id)).map((r) => ({ ...r, depth: 1 }))
    return loose.length > 0 ? [...sections, { key: 'other', label: 'Other', rows: loose }] : sections
  }, [data])

  const columns = useMemo<ColumnConfig<SceneRow>[]>(
    () => [
      {
        key: 'name',
        header: 'Scene',
        render: (row) => (
          <span className={row.depth > 1 ? 'pl-4' : undefined}>
            <Link to={`/scene/${row.slug}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
              {row.name}
            </Link>
            {row.language != null && <span className="text-sm text-muted-foreground"> · {languageName} only</span>}
          </span>
        ),
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
    [counts, languageName],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Scene</h1>
        <p className="text-sm text-muted-foreground">
          Places and situations — self-introduction first, then places grouped by how often you need
          them — with the words, set phrases and sentences each calls for.
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
