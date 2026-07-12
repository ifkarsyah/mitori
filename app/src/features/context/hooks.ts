import { useMemo } from 'react'
import { useContextList, useKotobaList } from '@/features/kotoba/hooks'
import type { Kotoba } from '@/features/kotoba/api'

export { useContextList } from '@/features/kotoba/hooks'

export function useContextById(id: number | undefined) {
  const query = useContextList()
  const context = query.data?.find((row) => row.id === id)
  return { ...query, data: context }
}

export function useContextWordCounts() {
  const { data: kotoba } = useKotobaList()
  return useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of kotoba ?? []) {
      if (row.context_id == null) continue
      counts.set(row.context_id, (counts.get(row.context_id) ?? 0) + 1)
    }
    return counts
  }, [kotoba])
}

export function useKotobaForContext(contextId: number | undefined) {
  const query = useKotobaList()
  const words = useMemo<Kotoba[]>(() => {
    if (!query.data || contextId == null) return []
    return query.data.filter((row) => row.context_id === contextId)
  }, [query.data, contextId])
  return { ...query, data: words }
}
