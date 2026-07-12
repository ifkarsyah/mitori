import { useMemo } from 'react'
import { useKotobaList, useSourceList } from '@/features/kotoba/hooks'
import type { Kotoba } from '@/features/kotoba/api'

export { useSourceList } from '@/features/kotoba/hooks'

export function useSourceById(id: number | undefined) {
  const query = useSourceList()
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
