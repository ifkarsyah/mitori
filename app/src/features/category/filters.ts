import type { CategorySummary } from './hooks'

export const ALL = '__all__'

export type CategoryGroupBy = 'kind' | 'none'

export type CategoryFilterState = {
  search: string
  kind: string
  groupBy: CategoryGroupBy
}

export const defaultCategoryFilterState: CategoryFilterState = {
  search: '',
  kind: ALL,
  groupBy: 'kind',
}

export function kindLabel(value: string): string {
  return value === 'core'
    ? 'Core — the objects and ideas themselves'
    : 'Situational — vocabulary for a place or transaction'
}

export function applyCategoryFilters(
  rows: CategorySummary[],
  filters: CategoryFilterState,
): CategorySummary[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.kind !== ALL && row.category.kind !== filters.kind) return false
    if (search && !row.category.name.toLowerCase().includes(search)) return false
    return true
  })
}

export type CategoryGroup = { key: string; label: string; rows: CategorySummary[] }

export function groupCategoriesBy(
  rows: CategorySummary[],
  groupBy: CategoryGroupBy,
): CategoryGroup[] {
  if (groupBy === 'none') return [{ key: 'all', label: 'All categories', rows }]
  return ['core', 'situational']
    .map((kind) => ({
      key: kind,
      label: kindLabel(kind),
      rows: rows.filter((r) => r.category.kind === kind),
    }))
    .filter((g) => g.rows.length > 0)
}
