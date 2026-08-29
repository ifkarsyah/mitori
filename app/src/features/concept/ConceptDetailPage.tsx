import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import type { Kotoba } from '@/features/kotoba/api'
import { useLanguage } from '@/features/language/useLanguage'
import { useCategoryLookup } from '@/features/category/hooks'
import { useConceptById, useKotobaForConcept } from './hooks'
import { partOfSpeechLabel } from './filters'

function WordCard({ word }: { word: Kotoba }) {
  const { labelFor } = useLanguage()
  return (
    <li className="flex flex-col gap-1 py-3">
      <div className="flex items-baseline gap-2">
        <Badge variant="outline">{labelFor(word.language)}</Badge>
        <Link to={`/kotoba/${word.word}`} className="text-2xl hover:underline">
          {word.gender ? `${word.gender} ${word.word}` : word.word}
        </Link>
        {word.reading && <span className="text-muted-foreground">【{word.reading}】</span>}
        {word.plural && <span className="text-muted-foreground">pl. {word.plural}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {word.jlpt && <Badge variant="outline">{word.jlpt.toUpperCase()}</Badge>}
        {word.cefr && <Badge variant="outline">{word.cefr.toUpperCase()}</Badge>}
        {word.sub_part_of_speech && <Badge variant="outline">{word.sub_part_of_speech}</Badge>}
      </div>
    </li>
  )
}

export function ConceptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const conceptId = id ? Number(id) : undefined

  const { data: concept, isLoading, isError, error, refetch } = useConceptById(conceptId)
  const categories = useCategoryLookup()
  const { data: words } = useKotobaForConcept(conceptId)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!concept) {
    return <p className="py-12 text-center text-muted-foreground">Concept not found.</p>
  }

  const ja = words.filter((w) => w.language === 'ja')
  const de = words.filter((w) => w.language === 'de')

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/concept" />} nativeButton={false} className="w-fit">
        ← Back to concepts
      </Button>

      <div className="flex flex-col gap-2">
        <span className="text-4xl">{concept.gloss}</span>
        <div className="flex flex-wrap gap-2">
          {concept.part_of_speech && (
            <Badge variant="outline">{partOfSpeechLabel(concept.part_of_speech)}</Badge>
          )}
          {concept.category_id != null && categories.byId.get(concept.category_id) && (
            <Badge variant="secondary">
              {categories.topLevelOf(concept.category_id)?.name}
              {' · '}
              {categories.byId.get(concept.category_id)?.name}
            </Badge>
          )}
          {concept.tier != null && <Badge variant="outline">Tier {concept.tier}</Badge>}
          {concept.slug == null && (
            <Badge variant="outline">Outside the syllabus</Badge>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Japanese ({ja.length})</h2>
        {ja.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Japanese word recorded for this concept.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {ja.map((w) => (
              <WordCard key={w.id} word={w} />
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">German ({de.length})</h2>
        {de.length === 0 ? (
          <p className="text-sm text-muted-foreground">No German word recorded for this concept.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {de.map((w) => (
              <WordCard key={w.id} word={w} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
