import { useMemo } from 'react'
import { StatCard } from '@/components/StatCard'
import { GroupCountList } from '@/components/GroupCountList'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useKanjiList } from '@/features/kanji/hooks'
import { groupKanjiBy } from '@/features/kanji/filters'
import { useWordList, useSentencesList } from '@/features/word/hooks'
import { useCategoryList } from '@/features/category/hooks'
import { useMeaningCategories } from '@/features/meaning/hooks'
import { groupWordBy } from '@/features/word/filters'
import { useLanguage } from '@/features/language/useLanguage'

export function OverviewPage() {
  const { current, labelFor, language } = useLanguage()
  const showKanji = current?.script === 'japanese'
  const kanjiQuery = useKanjiList()
  const wordQuery = useWordList()
  const sentencesQuery = useSentencesList()
  const categoryQuery = useCategoryList()
  const categoryOfMeaning = useMeaningCategories()

  const isLoading =
    kanjiQuery.isLoading || wordQuery.isLoading || sentencesQuery.isLoading || categoryQuery.isLoading
  const firstError = kanjiQuery.error || wordQuery.error || sentencesQuery.error || categoryQuery.error

  const kanjiByJlpt = useMemo(
    () => groupKanjiBy(kanjiQuery.data ?? [], 'jlpt').map((g) => ({ ...g, count: g.rows.length })),
    [kanjiQuery.data],
  )
  const kanjiByGrade = useMemo(
    () => groupKanjiBy(kanjiQuery.data ?? [], 'grade').map((g) => ({ ...g, count: g.rows.length })),
    [kanjiQuery.data],
  )
  const wordByPartOfSpeech = useMemo(
    () =>
      groupWordBy(wordQuery.data ?? [], 'part_of_speech', categoryOfMeaning).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [wordQuery.data, categoryOfMeaning],
  )
  const wordByCategory = useMemo(
    () =>
      groupWordBy(wordQuery.data ?? [], 'category', categoryOfMeaning).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [wordQuery.data, categoryOfMeaning],
  )
  const wordByKanaType = useMemo(
    () =>
      groupWordBy(wordQuery.data ?? [], 'kana_type', categoryOfMeaning).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [wordQuery.data, categoryOfMeaning],
  )

  if (isLoading) return <LoadingState />
  if (firstError) return <ErrorState error={firstError} />

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your {labelFor(language)} vocabulary at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {showKanji && <StatCard label="Kanji" value={kanjiQuery.data?.length ?? 0} />}
        <StatCard label="Word" value={wordQuery.data?.length ?? 0} />
        <StatCard label="Sentences" value={sentencesQuery.data?.length ?? 0} />
        <StatCard label="Categories" value={categoryQuery.data?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {showKanji && <GroupCountList title="Kanji by JLPT" groups={kanjiByJlpt} />}
        {showKanji && <GroupCountList title="Kanji by grade" groups={kanjiByGrade} />}
        <GroupCountList title="Word by part of speech" groups={wordByPartOfSpeech} />
        {/* Kana type is Japanese-only; German gets a context breakdown instead. */}
        {showKanji ? (
          <GroupCountList title="Word by kana type" groups={wordByKanaType} />
        ) : (
          <GroupCountList title="Word by category" groups={wordByCategory} />
        )}
      </div>
    </div>
  )
}
