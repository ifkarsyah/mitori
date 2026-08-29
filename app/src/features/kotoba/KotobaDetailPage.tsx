import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import {
  useConceptById,
  useKanjiForWord,
  useKotobaByWord,
  useKotobaForConcept,
  useSentencesForWord,
} from './hooks'
import { levelLabel, partOfSpeechLabel, kanaTypeLabel } from './filters'
import { useLanguage } from '@/features/language/useLanguage'

export function KotobaDetailPage() {
  const { word } = useParams<{ word: string }>()
  const { labelFor } = useLanguage()

  const { data: kotoba, isLoading, isError, error, refetch } = useKotobaByWord(word)
  const { data: sentences, isLoading: sentencesLoading } = useSentencesForWord(kotoba?.id)
  const { data: composingKanji, isLoading: kanjiLoading } = useKanjiForWord(kotoba?.id)
  const { data: concept } = useConceptById(kotoba?.concept_id)
  const { data: conceptWords } = useKotobaForConcept(kotoba?.concept_id)
  const translations = conceptWords.filter((row) => row.id !== kotoba?.id)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!kotoba) return <p className="py-12 text-center text-muted-foreground">Word not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/kotoba" />} nativeButton={false} className="w-fit">
        ← Back to kotoba
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl">
            {kotoba.gender ? `${kotoba.gender} ${kotoba.word}` : kotoba.word}
          </span>
          {kotoba.reading && <span className="text-lg text-muted-foreground">【{kotoba.reading}】</span>}
          {kotoba.plural && (
            <span className="text-lg text-muted-foreground">pl. {kotoba.plural}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{labelFor(kotoba.language)}</Badge>
          {kotoba.level && <Badge variant="outline">{levelLabel(kotoba.level)}</Badge>}
          {kotoba.part_of_speech && (
            <Badge variant="outline">{partOfSpeechLabel(kotoba.part_of_speech)}</Badge>
          )}
          {kotoba.sub_part_of_speech && <Badge variant="outline">{kotoba.sub_part_of_speech}</Badge>}
          {kotoba.kana_type && <Badge variant="outline">{kanaTypeLabel(kotoba.kana_type)}</Badge>}
        </div>
        <div className="flex flex-wrap gap-1">
          {(kotoba.meanings ?? []).map((meaning) => (
            <Badge key={meaning} variant="secondary">
              {meaning}
            </Badge>
          ))}
        </div>
      </div>

      {concept && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Concept</h2>
          <Link to={`/concept/${concept.id}`} className="hover:underline">
            {concept.gloss}
          </Link>
          {translations.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No other word recorded for this concept yet.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y">
              {translations.map((t) => (
                <li key={t.id} className="flex items-baseline gap-2 py-2">
                  <Badge variant="outline">{labelFor(t.language)}</Badge>
                  <Link to={`/kotoba/${t.word}`} className="text-lg hover:underline">
                    {t.gender ? `${t.gender} ${t.word}` : t.word}
                  </Link>
                  {t.reading && <span className="text-sm text-muted-foreground">【{t.reading}】</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {kotoba.kana_type === 'kanji' && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Composed of</h2>
          {kanjiLoading ? (
            <LoadingState />
          ) : composingKanji.length === 0 ? (
            <p className="text-sm text-muted-foreground">No kanji breakdown recorded for this word.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {composingKanji.map((k) => (
                <li key={k.kanjiId} className="py-2">
                  <Link to={`/kanji/${k.character}`} className="text-lg hover:underline">
                    {k.character}
                  </Link>
                  {k.kanjiMeaningInWord && (
                    <p className="text-sm text-muted-foreground">{k.kanjiMeaningInWord}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Example sentences ({sentences.length})
        </h2>
        {sentencesLoading ? (
          <LoadingState />
        ) : sentences.length === 0 ? (
          <p className="text-sm text-muted-foreground">No example sentences recorded for this word.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sentences.map((s) => (
              <li key={s.id}>
                <p>{s.sentence}</p>
                {s.meaning && <p className="text-sm text-muted-foreground">{s.meaning}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
