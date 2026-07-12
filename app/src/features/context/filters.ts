import type { Context } from '@/features/kotoba/api'

export const ALL = '__all__'

export type ContextGroupBy = 'none' | 'kind'

export type ContextFilterState = {
  search: string
  kind: string
  groupBy: ContextGroupBy
}

export const defaultContextFilterState: ContextFilterState = {
  search: '',
  kind: ALL,
  groupBy: 'kind',
}

export function applyContextFilters(rows: Context[], filters: ContextFilterState): Context[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.kind !== ALL && row.kind !== filters.kind) return false
    if (search) {
      const haystack = [row.name, row.Description].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export function kindLabel(kind: string): string {
  return kind === 'concrete' ? 'Concrete (situation encountered)' : 'Abstract (topic)'
}

export type ContextGroup = { key: string; label: string; rows: Context[] }

export function groupContextsBy(rows: Context[], groupBy: ContextGroupBy): ContextGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All contexts', rows }]
  }

  const buckets = new Map<string, Context[]>()
  for (const row of rows) {
    const key = row.kind
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(row)
    } else {
      buckets.set(key, [row])
    }
  }

  const order = ['concrete', 'abstract']
  const sortedKeys = order.filter((k) => buckets.has(k))
  return sortedKeys.map((key) => ({
    key,
    label: kindLabel(key),
    rows: buckets.get(key)!,
  }))
}
