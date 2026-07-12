import type { Source } from '@/features/kotoba/api'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type SourceGroupBy = 'none' | 'context'

export type SourceFilterState = {
  search: string
  contextId: string
  groupBy: SourceGroupBy
}

export const defaultSourceFilterState: SourceFilterState = {
  search: '',
  contextId: ALL,
  groupBy: 'none',
}

export function applySourceFilters(rows: Source[], filters: SourceFilterState): Source[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.contextId !== ALL) {
      const key = row.context_id != null ? String(row.context_id) : UNCLASSIFIED
      if (key !== filters.contextId) return false
    }
    if (search) {
      const haystack = [row.name, row.url].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export function sourceContextLabel(value: string, contextNameById: Map<number, string>): string {
  if (value === UNCLASSIFIED) return 'No context'
  const name = contextNameById.get(Number(value))
  return name ?? value
}

export type SourceGroup = { key: string; label: string; rows: Source[] }

export function groupSourcesBy(
  rows: Source[],
  groupBy: SourceGroupBy,
  contextNameById: Map<number, string>,
): SourceGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All sources', rows }]
  }

  const buckets = new Map<string, Source[]>()
  for (const row of rows) {
    const key = row.context_id != null ? String(row.context_id) : UNCLASSIFIED
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(row)
    } else {
      buckets.set(key, [row])
    }
  }

  const known = [...buckets.keys()].filter((k) => k !== UNCLASSIFIED).sort()
  const hasUnclassified = buckets.has(UNCLASSIFIED)
  const sortedKeys = [...known, ...(hasUnclassified ? [UNCLASSIFIED] : [])]

  return sortedKeys.map((key) => ({
    key,
    label: sourceContextLabel(key, contextNameById),
    rows: buckets.get(key)!,
  }))
}

export function distinctSourceContextIds(rows: Source[]): string[] {
  const present = new Set(
    rows.map((row) => (row.context_id != null ? String(row.context_id) : UNCLASSIFIED)),
  )
  const known = [...present].filter((k) => k !== UNCLASSIFIED).sort()
  const hasUnclassified = present.has(UNCLASSIFIED)
  return [...known, ...(hasUnclassified ? [UNCLASSIFIED] : [])]
}
