import { useMemo } from 'react'
import { useContextList as useAllContextList, useKotobaList } from '@/features/kotoba/hooks'
import type { Kotoba } from '@/features/kotoba/api'

/**
 * Contexts that hold at least one word in the active language. The context
 * taxonomy itself is shared between languages, so membership is derived from
 * the words rather than from a column on `context`.
 */
export function useContextList() {
  const query = useAllContextList()
  const { data: kotoba } = useKotobaList()

  const data = useMemo(() => {
    const usedContextIds = new Set<number>()
    for (const row of kotoba ?? []) {
      if (row.context_id != null) usedContextIds.add(row.context_id)
    }
    return (query.data ?? []).filter((context) => usedContextIds.has(context.id))
  }, [query.data, kotoba])

  return { ...query, data }
}

export function useContextById(id: number | undefined) {
  // Unscoped: a context deep-linked by id should still resolve its name.
  const query = useAllContextList()
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
