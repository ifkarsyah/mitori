import { useMemo } from 'react'
import { StatCard } from '@/components/StatCard'
import { GroupCountList } from '@/components/GroupCountList'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useKanjiList } from '@/features/kanji/hooks'
import { groupKanjiBy } from '@/features/kanji/filters'
import { useKotobaList, useSentencesList } from '@/features/kotoba/hooks'
import { useCategoryList } from '@/features/category/hooks'
import { useConceptCategories } from '@/features/concept/hooks'
import { groupKotobaBy } from '@/features/kotoba/filters'
import { useLanguage } from '@/features/language/useLanguage'

export function OverviewPage() {
  const { current, labelFor, language } = useLanguage()
  const showKanji = current?.script === 'japanese'
  const kanjiQuery = useKanjiList()
  const kotobaQuery = useKotobaList()
  const sentencesQuery = useSentencesList()
  const categoryQuery = useCategoryList()
  const categoryOfConcept = useConceptCategories()

  const isLoading =
    kanjiQuery.isLoading || kotobaQuery.isLoading || sentencesQuery.isLoading || categoryQuery.isLoading
  const firstError = kanjiQuery.error || kotobaQuery.error || sentencesQuery.error || categoryQuery.error

  const kanjiByJlpt = useMemo(
    () => groupKanjiBy(kanjiQuery.data ?? [], 'jlpt').map((g) => ({ ...g, count: g.rows.length })),
    [kanjiQuery.data],
  )
  const kanjiByGrade = useMemo(
    () => groupKanjiBy(kanjiQuery.data ?? [], 'grade').map((g) => ({ ...g, count: g.rows.length })),
    [kanjiQuery.data],
  )
  const kotobaByPartOfSpeech = useMemo(
    () =>
      groupKotobaBy(kotobaQuery.data ?? [], 'part_of_speech', categoryOfConcept).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [kotobaQuery.data, categoryOfConcept],
  )
  const kotobaByCategory = useMemo(
    () =>
      groupKotobaBy(kotobaQuery.data ?? [], 'category', categoryOfConcept).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [kotobaQuery.data, categoryOfConcept],
  )
  const kotobaByKanaType = useMemo(
    () =>
      groupKotobaBy(kotobaQuery.data ?? [], 'kana_type', categoryOfConcept).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [kotobaQuery.data, categoryOfConcept],
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
        <StatCard label="Kotoba" value={kotobaQuery.data?.length ?? 0} />
        <StatCard label="Sentences" value={sentencesQuery.data?.length ?? 0} />
        <StatCard label="Categories" value={categoryQuery.data?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {showKanji && <GroupCountList title="Kanji by JLPT" groups={kanjiByJlpt} />}
        {showKanji && <GroupCountList title="Kanji by grade" groups={kanjiByGrade} />}
        <GroupCountList title="Kotoba by part of speech" groups={kotobaByPartOfSpeech} />
        {/* Kana type is Japanese-only; German gets a context breakdown instead. */}
        {showKanji ? (
          <GroupCountList title="Kotoba by kana type" groups={kotobaByKanaType} />
        ) : (
          <GroupCountList title="Kotoba by category" groups={kotobaByCategory} />
        )}
      </div>
    </div>
  )
}
