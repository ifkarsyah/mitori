import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useKanjiByCharacter, useWordsForKanji } from './hooks'
import { gradeLabel, jlptLabel } from './filters'

export function KanjiDetailPage() {
  const { character } = useParams<{ character: string }>()

  const { data: kanji, isLoading, isError, error, refetch } = useKanjiByCharacter(character)
  const { data: words, isLoading: wordsLoading } = useWordsForKanji(kanji?.id)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!kanji) return <p className="py-12 text-center text-muted-foreground">Kanji not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/kanji" />} nativeButton={false} className="w-fit">
        ← Back to kanji
      </Button>

      <div className="flex items-start gap-6">
        <span className="text-6xl">{kanji.character}</span>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {kanji.grade && <Badge variant="outline">{gradeLabel(kanji.grade)}</Badge>}
            {kanji.jlpt && <Badge variant="outline">{jlptLabel(kanji.jlpt)}</Badge>}
          </div>
          <div className="flex flex-wrap gap-1">
            {(kanji.meanings ?? []).map((meaning) => (
              <Badge key={meaning} variant="secondary">
                {meaning}
              </Badge>
            ))}
          </div>
          <div className="flex gap-3 text-sm">
            {kanji.kanjimap_url && (
              <a
                className="text-primary underline underline-offset-4"
                href={`https://${kanji.kanjimap_url}`}
                target="_blank"
                rel="noreferrer"
              >
                kanjimap
              </a>
            )}
            {kanji.kanjigraph_url && (
              <a
                className="text-primary underline underline-offset-4"
                href={`https://${kanji.kanjigraph_url}`}
                target="_blank"
                rel="noreferrer"
              >
                kanjigraph
              </a>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Used in {words.length} word{words.length === 1 ? '' : 's'}
        </h2>
        {wordsLoading ? (
          <LoadingState />
        ) : words.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No kotoba in the database currently use this kanji.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {words.map((w) => (
              <li key={w.wordId} className="py-2">
                <Link to={`/kotoba/${w.word}`} className="hover:underline">
                  <span className="font-medium">{w.word}</span>
                  {w.reading && (
                    <span className="ml-2 text-sm text-muted-foreground">【{w.reading}】</span>
                  )}
                </Link>
                {w.kanjiMeaningInWord && (
                  <p className="text-sm text-muted-foreground">{w.kanjiMeaningInWord}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
