import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useKanjiForWord, useKotobaByWord, useSentencesForWord } from './hooks'
import { jlptLabel, partOfSpeechLabel, kanaTypeLabel } from './filters'

export function KotobaDetailPage() {
  const { word } = useParams<{ word: string }>()

  const { data: kotoba, isLoading, isError, error, refetch } = useKotobaByWord(word)
  const { data: sentences, isLoading: sentencesLoading } = useSentencesForWord(kotoba?.id)
  const { data: composingKanji, isLoading: kanjiLoading } = useKanjiForWord(kotoba?.id)

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
          <span className="text-4xl">{kotoba.word}</span>
          {kotoba.reading && <span className="text-lg text-muted-foreground">【{kotoba.reading}】</span>}
        </div>
        <div className="flex gap-2">
          {kotoba.jlpt && <Badge variant="outline">{jlptLabel(kotoba.jlpt)}</Badge>}
          {kotoba.part_of_speech && (
            <Badge variant="outline">{partOfSpeechLabel(kotoba.part_of_speech)}</Badge>
          )}
          {kotoba.sub_part_of_speech && <Badge variant="outline">{kotoba.sub_part_of_speech}</Badge>}
          <Badge variant="outline">{kanaTypeLabel(kotoba.kana_type)}</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {(kotoba.meanings ?? []).map((meaning) => (
            <Badge key={meaning} variant="secondary">
              {meaning}
            </Badge>
          ))}
        </div>
      </div>

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
