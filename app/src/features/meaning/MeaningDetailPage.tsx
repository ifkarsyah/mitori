import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import type { Kotoba } from '@/features/kotoba/api'
import { useLanguage } from '@/features/language/useLanguage'
import { useCategoryLookup } from '@/features/category/hooks'
import { useMeaningById, useKotobaForMeaning } from './hooks'
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
        {word.level && <Badge variant="outline">{word.level.toUpperCase()}</Badge>}
        {word.sub_part_of_speech && <Badge variant="outline">{word.sub_part_of_speech}</Badge>}
      </div>
    </li>
  )
}

export function MeaningDetailPage() {
  const { id } = useParams<{ id: string }>()
  const meaningId = id ? Number(id) : undefined

  const { data: meaning, isLoading, isError, error, refetch } = useMeaningById(meaningId)
  const categories = useCategoryLookup()
  const { data: words } = useKotobaForMeaning(meaningId)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!meaning) {
    return <p className="py-12 text-center text-muted-foreground">Meaning not found.</p>
  }

  const ja = words.filter((w) => w.language === 'ja')
  const de = words.filter((w) => w.language === 'de')

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/meaning" />} nativeButton={false} className="w-fit">
        ← Back to meanings
      </Button>

      <div className="flex flex-col gap-2">
        <span className="text-4xl">{meaning.gloss}</span>
        <div className="flex flex-wrap gap-2">
          {meaning.part_of_speech && (
            <Badge variant="outline">{partOfSpeechLabel(meaning.part_of_speech)}</Badge>
          )}
          {meaning.category_id != null && categories.byId.get(meaning.category_id) && (
            <Badge variant="secondary">
              {categories.topLevelOf(meaning.category_id)?.name}
              {' · '}
              {categories.byId.get(meaning.category_id)?.name}
            </Badge>
          )}
          {meaning.tier != null && <Badge variant="outline">Tier {meaning.tier}</Badge>}
          {meaning.slug == null && (
            <Badge variant="outline">Outside the syllabus</Badge>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Japanese ({ja.length})</h2>
        {ja.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Japanese word recorded for this meaning.</p>
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
          <p className="text-sm text-muted-foreground">No German word recorded for this meaning.</p>
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
