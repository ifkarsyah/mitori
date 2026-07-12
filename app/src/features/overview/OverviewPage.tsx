import { useMemo } from 'react'
import { StatCard } from '@/components/StatCard'
import { GroupCountList } from '@/components/GroupCountList'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useKanjiList } from '@/features/kanji/hooks'
import { groupKanjiBy } from '@/features/kanji/filters'
import { useContextList, useKotobaList, useSentencesList } from '@/features/kotoba/hooks'
import { groupKotobaBy } from '@/features/kotoba/filters'

export function OverviewPage() {
  const kanjiQuery = useKanjiList()
  const kotobaQuery = useKotobaList()
  const sentencesQuery = useSentencesList()
  const contextQuery = useContextList()

  const isLoading =
    kanjiQuery.isLoading || kotobaQuery.isLoading || sentencesQuery.isLoading || contextQuery.isLoading
  const firstError = kanjiQuery.error || kotobaQuery.error || sentencesQuery.error || contextQuery.error

  const contextNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of contextQuery.data ?? []) {
      if (c.name) map.set(c.id, c.name)
    }
    return map
  }, [contextQuery.data])

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
      groupKotobaBy(kotobaQuery.data ?? [], 'part_of_speech', contextNameById).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [kotobaQuery.data, contextNameById],
  )
  const kotobaByKanaType = useMemo(
    () =>
      groupKotobaBy(kotobaQuery.data ?? [], 'kana_type', contextNameById).map((g) => ({
        ...g,
        count: g.rows.length,
      })),
    [kotobaQuery.data, contextNameById],
  )

  if (isLoading) return <LoadingState />
  if (firstError) return <ErrorState error={firstError} />

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Your Japanese vocabulary at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Kanji" value={kanjiQuery.data?.length ?? 0} />
        <StatCard label="Kotoba" value={kotobaQuery.data?.length ?? 0} />
        <StatCard label="Sentences" value={sentencesQuery.data?.length ?? 0} />
        <StatCard label="Contexts" value={contextQuery.data?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <GroupCountList title="Kanji by JLPT" groups={kanjiByJlpt} />
        <GroupCountList title="Kanji by grade" groups={kanjiByGrade} />
        <GroupCountList title="Kotoba by part of speech" groups={kotobaByPartOfSpeech} />
        <GroupCountList title="Kotoba by kana type" groups={kotobaByKanaType} />
      </div>
    </div>
  )
}
