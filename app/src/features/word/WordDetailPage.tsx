import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import {
  useMeaningById,
  useKanjiForWord,
  useWordByText,
  useWordForMeaning,
  useSentencesForWord,
} from './hooks'
import { levelLabel, partOfSpeechLabel, kanaTypeLabel } from './filters'
import { useLanguage } from '@/features/language/useLanguage'

export function WordDetailPage() {
  const { word: text } = useParams<{ word: string }>()
  const { labelFor } = useLanguage()

  const { data: word, isLoading, isError, error, refetch } = useWordByText(text)
  const { data: sentences, isLoading: sentencesLoading } = useSentencesForWord(word?.id)
  const { data: composingKanji, isLoading: kanjiLoading } = useKanjiForWord(word?.id)
  const { data: meaning } = useMeaningById(word?.meaning_id)
  const { data: meaningWords } = useWordForMeaning(word?.meaning_id)
  const translations = meaningWords.filter(
    (row) => row.id !== word?.id || row.language !== word?.language,
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!word) return <p className="py-12 text-center text-muted-foreground">Word not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/word" />} nativeButton={false} className="w-fit">
        ← Back to words
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl">
            {word.gender ? `${word.gender} ${word.word}` : word.word}
          </span>
          {word.reading && <span className="text-lg text-muted-foreground">【{word.reading}】</span>}
          {word.plural && (
            <span className="text-lg text-muted-foreground">pl. {word.plural}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{labelFor(word.language)}</Badge>
          {word.level && <Badge variant="outline">{levelLabel(word.level)}</Badge>}
          {word.part_of_speech && (
            <Badge variant="outline">{partOfSpeechLabel(word.part_of_speech)}</Badge>
          )}
          {word.sub_part_of_speech && <Badge variant="outline">{word.sub_part_of_speech}</Badge>}
          {word.kana_type && <Badge variant="outline">{kanaTypeLabel(word.kana_type)}</Badge>}
        </div>
        <div className="flex flex-wrap gap-1">
          {(word.meanings ?? []).map((gloss) => (
            <Badge key={gloss} variant="secondary">
              {gloss}
            </Badge>
          ))}
        </div>
      </div>

      {meaning && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Shared meaning</h2>
          <Link to={`/meaning/${meaning.id}`} className="hover:underline">
            {meaning.gloss}
          </Link>
          {translations.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No other word recorded for this meaning yet.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y">
              {translations.map((t) => (
                <li key={`${t.language}-${t.id}`} className="flex items-baseline gap-2 py-2">
                  <Badge variant="outline">{labelFor(t.language)}</Badge>
                  <Link to={`/word/${t.word}`} className="text-lg hover:underline">
                    {t.gender ? `${t.gender} ${t.word}` : t.word}
                  </Link>
                  {t.reading && <span className="text-sm text-muted-foreground">【{t.reading}】</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {word.kana_type === 'kanji' && (
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
