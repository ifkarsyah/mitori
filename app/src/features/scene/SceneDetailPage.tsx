import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { WordExplorer } from '@/features/word/WordExplorer'
import { useSourceList } from '@/features/word/hooks'
import { useLanguage } from '@/features/language/useLanguage'
import type { MeaningRow } from '@/features/meaning/hooks'
import type { SentenceWithWords } from './hooks'
import {
  useChildScenes,
  useMeaningRowsForScene,
  useSceneBySlug,
  useSceneLookup,
  useSentencesForScene,
  useWordForScene,
} from './hooks'

function SentenceList({ rows, empty }: { rows: SentenceWithWords[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="flex flex-col divide-y">
      {rows.map((s) => (
        <li key={s.id} className="flex flex-col gap-1 py-3">
          <span className="text-xl">{s.sentence}</span>
          {s.meaning && <span className="text-muted-foreground">{s.meaning}</span>}
          {s.words.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {s.words.map((w) => (
                <Link key={w.id} to={`/word/${w.word}`}>
                  <Badge variant="secondary">{w.word}</Badge>
                </Link>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function SceneDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { language, current } = useLanguage()
  const { data: scene, isLoading, isError, error, refetch } = useSceneBySlug(slug)
  const sceneById = useSceneLookup()
  const parent = scene?.parent_id != null ? sceneById.get(scene.parent_id) : undefined
  const children = useChildScenes(scene?.id)
  const { data: meaningRows } = useMeaningRowsForScene(scene?.id)
  const { data: sentences } = useSentencesForScene(scene?.id)
  const { data: words, isLoading: wordsLoading } = useWordForScene(scene?.id)
  const { data: sources } = useSourceList()
  const sceneSources = (sources ?? []).filter((s) => scene != null && s.scene_id === scene.id)

  const columns = useMemo<ColumnConfig<MeaningRow>[]>(
    () => [
      {
        key: 'gloss',
        header: 'Meaning',
        render: (row) => (
          <Link to={`/meaning/${row.meaning.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {row.meaning.gloss}
          </Link>
        ),
        sortValue: (row) => row.meaning.gloss,
      },
      {
        key: 'category',
        header: 'Category',
        render: (row) =>
          row.category ? (
            <Link
              to={`/category/${row.category.slug}`}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.category.name}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        sortValue: (row) => row.category?.name ?? null,
      },
      {
        key: 'word',
        header: current?.name ?? 'Word',
        render: (row) => {
          const list = row.wordsByLanguage.get(language) ?? []
          if (list.length === 0) return <span className="text-muted-foreground">—</span>
          return (
            <div className="flex flex-wrap gap-x-2">
              {list.map((w) => (
                <Link key={w.id} to={`/word/${w.word}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                  {w.gender ? `${w.gender} ${w.word}` : w.word}
                </Link>
              ))}
            </div>
          )
        },
        sortValue: (row) => row.wordsByLanguage.get(language)?.[0]?.word ?? null,
      },
    ],
    [language, current],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!scene) return <p className="py-12 text-center text-muted-foreground">Scene not found.</p>

  const covered = meaningRows.filter((r) => (r.wordsByLanguage.get(language)?.length ?? 0) > 0).length

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/scene" />} nativeButton={false} className="w-fit">
        ← Back to scenes
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{scene.name}</span>
          {parent && (
            <Link to={`/scene/${parent.slug}`}>
              <Badge variant="outline">in {parent.name}</Badge>
            </Link>
          )}
          {scene.language != null && <Badge variant="secondary">Only in {current?.name}</Badge>}
        </div>
        {scene.description && <p className="text-muted-foreground">{scene.description}</p>}
        {children.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Narrower scenes:</span>
            {children.map((c) => (
              <Link key={c.id} to={`/scene/${c.slug}`}>
                <Badge variant="secondary">{c.name}</Badge>
              </Link>
            ))}
          </div>
        )}
        {sceneSources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Sources:</span>
            {sceneSources.map((s) => (
              <Link key={s.id} to={`/source/${s.id}`}>
                <Badge variant="outline">{s.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Phrases ({sentences.phrases.length})</h2>
        <SentenceList rows={sentences.phrases} empty="No phrases recorded for this scene yet." />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Meanings ({current?.name} {covered}/{meaningRows.length})
        </h2>
        <GroupedTable
          groups={[{ key: 'all', label: scene.name, rows: meaningRows }]}
          columns={columns}
          getRowKey={(row) => row.meaning.id}
          getRowHref={(row) => `/meaning/${row.meaning.id}`}
          emptyMessage="No meanings linked to this scene yet."
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Sentences ({sentences.sentences.length})</h2>
        <SentenceList rows={sentences.sentences} empty="No sentences set in this scene yet." />
      </div>

      {words.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Words met here ({words.length})</h2>
          {wordsLoading ? <LoadingState /> : <WordExplorer words={words} includeCategoryFilter={false} />}
        </div>
      )}
    </div>
  )
}
