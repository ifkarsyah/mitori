import { useMemo } from 'react'
import { useWordList, useSourceList as useSourceListQuery } from '@/features/word/hooks'
import type { Word } from '@/features/word/api'

/** Sources in the active language that actually hold a word. */
export function useSourceList() {
  const query = useSourceListQuery()
  const { data: words } = useWordList()

  const data = useMemo(() => {
    const usedSourceIds = new Set<number>()
    for (const row of words ?? []) {
      if (row.source_id != null) usedSourceIds.add(row.source_id)
    }
    return (query.data ?? []).filter((source) => usedSourceIds.has(source.id))
  }, [query.data, words])

  return { ...query, data }
}

export function useSourceById(id: number | undefined) {
  const query = useSourceListQuery()
  const source = query.data?.find((row) => row.id === id)
  return { ...query, data: source }
}

export function useSourceWordCounts() {
  const { data: words } = useWordList()
  return useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of words ?? []) {
      if (row.source_id == null) continue
      counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1)
    }
    return counts
  }, [words])
}

export function useWordForSource(sourceId: number | undefined) {
  const query = useWordList()
  const words = useMemo<Word[]>(() => {
    if (!query.data || sourceId == null) return []
    return query.data.filter((row) => row.source_id === sourceId)
  }, [query.data, sourceId])
  return { ...query, data: words }
}
