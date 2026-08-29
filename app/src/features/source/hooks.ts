import { useMemo } from 'react'
import { useKotobaList, useSourceList as useAllSourceList } from '@/features/kotoba/hooks'
import type { Kotoba } from '@/features/kotoba/api'

/**
 * Sources that actually hold a word in the active language. `source` has no
 * language column of its own — a shop or site isn't inherently Japanese and
 * could later hold words in both — so membership is derived from the words.
 */
export function useSourceList() {
  const query = useAllSourceList()
  const { data: kotoba } = useKotobaList()

  const data = useMemo(() => {
    const usedSourceIds = new Set<number>()
    for (const row of kotoba ?? []) {
      if (row.source_id != null) usedSourceIds.add(row.source_id)
    }
    return (query.data ?? []).filter((source) => usedSourceIds.has(source.id))
  }, [query.data, kotoba])

  return { ...query, data }
}

export function useSourceById(id: number | undefined) {
  // Unscoped: a source deep-linked by id should still resolve its name.
  const query = useAllSourceList()
  const source = query.data?.find((row) => row.id === id)
  return { ...query, data: source }
}

export function useSourceWordCounts() {
  const { data: kotoba } = useKotobaList()
  return useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of kotoba ?? []) {
      if (row.source_id == null) continue
      counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1)
    }
    return counts
  }, [kotoba])
}

export function useKotobaForSource(sourceId: number | undefined) {
  const query = useKotobaList()
  const words = useMemo<Kotoba[]>(() => {
    if (!query.data || sourceId == null) return []
    return query.data.filter((row) => row.source_id === sourceId)
  }, [query.data, sourceId])
  return { ...query, data: words }
}
