import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { KotobaExplorer } from '@/features/kotoba/KotobaExplorer'
import { useCategoryLookup } from '@/features/category/hooks'
import { useSceneBySlug, useKotobaForScene, usePhrasesForScene } from './hooks'

export function SceneDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: scene, isLoading, isError, error, refetch } = useSceneBySlug(slug)
  const categories = useCategoryLookup()
  const category = scene?.category_id != null ? categories.byId.get(scene.category_id) : undefined
  const { data: phrases } = usePhrasesForScene(scene?.id)
  const { data: words, isLoading: wordsLoading } = useKotobaForScene(scene?.id)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!scene) return <p className="py-12 text-center text-muted-foreground">Scene not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/scene" />} nativeButton={false} className="w-fit">
        ← Back to scenes
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{scene.name}</span>
          {category && (
            <Link to={`/category/${category.slug}`}>
              <Badge variant="outline">{category.name}</Badge>
            </Link>
          )}
        </div>
        {scene.description && <p className="text-muted-foreground">{scene.description}</p>}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Phrases ({phrases.length})</h2>
        {phrases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No phrases recorded for this scene yet.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {phrases.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 py-3">
                <span className="text-xl">{p.sentence}</span>
                {p.meaning && <span className="text-muted-foreground">{p.meaning}</span>}
                {p.words.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.words.map((w) => (
                      <Link key={w.id} to={`/kotoba/${w.word}`}>
                        <Badge variant="secondary">{w.word}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Words ({words.length})</h2>
        {wordsLoading ? (
          <LoadingState />
        ) : words.length === 0 ? (
          <p className="text-sm text-muted-foreground">No words filed under this scene yet.</p>
        ) : (
          <KotobaExplorer words={words} includeCategoryFilter={false} />
        )}
      </div>
    </div>
  )
}
