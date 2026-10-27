import { useMemo } from 'react'
import { useKotobaList, useSourceList as useSourceListQuery } from '@/features/kotoba/hooks'
import type { Kotoba } from '@/features/kotoba/api'

/** Sources in the active language that actually hold a word. */
export function useSourceList() {
  const query = useSourceListQuery()
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
  const query = useSourceListQuery()
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
