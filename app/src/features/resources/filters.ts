import type { Resource } from './api'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type ResourceGroupBy = 'none' | 'channel' | 'category' | 'context'

export type ResourceFilterState = {
  search: string
  channelId: string
  category: string
  contextId: string
  groupBy: ResourceGroupBy
}

export const defaultResourceFilterState: ResourceFilterState = {
  search: '',
  channelId: ALL,
  category: ALL,
  contextId: ALL,
  groupBy: 'none',
}

function matchesSingleSelect(value: string | null, selected: string): boolean {
  if (selected === ALL) return true
  const key = value ?? UNCLASSIFIED
  return key === selected
}

export function applyResourceFilters(rows: Resource[], filters: ResourceFilterState): Resource[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    const channelKey = row.channel_id != null ? String(row.channel_id) : null
    if (!matchesSingleSelect(channelKey, filters.channelId)) return false
    if (!matchesSingleSelect(row.category, filters.category)) return false
    const contextKey = row.context_id != null ? String(row.context_id) : null
    if (!matchesSingleSelect(contextKey, filters.contextId)) return false
    if (search && !row.title.toLowerCase().includes(search)) return false
    return true
  })
}

function sortWithUnclassifiedLast(keys: string[]): string[] {
  const known = keys.filter((k) => k !== UNCLASSIFIED).sort()
  const hasUnclassified = keys.includes(UNCLASSIFIED)
  return [...known, ...(hasUnclassified ? [UNCLASSIFIED] : [])]
}

export function channelLabel(value: string, channelNameById: Map<number, string>): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no channel)'
  return channelNameById.get(Number(value)) ?? value
}

export function categoryLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Uncategorized'
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function contextLabel(value: string, contextNameById: Map<number, string>): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no context)'
  return contextNameById.get(Number(value)) ?? value
}

export type ResourceGroup = { key: string; label: string; rows: Resource[] }

function groupByKey(rows: Resource[], keyFor: (row: Resource) => string | null): Map<string, Resource[]> {
  const buckets = new Map<string, Resource[]>()
  for (const row of rows) {
    const key = keyFor(row) ?? UNCLASSIFIED
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(row)
    } else {
      buckets.set(key, [row])
    }
  }
  return buckets
}

export function groupResourcesBy(
  rows: Resource[],
  groupBy: ResourceGroupBy,
  channelNameById: Map<number, string>,
  contextNameById: Map<number, string>,
): ResourceGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All resources', rows }]
  }

  let buckets: Map<string, Resource[]>
  let labelFor: (key: string) => string

  if (groupBy === 'channel') {
    buckets = groupByKey(rows, (row) => (row.channel_id != null ? String(row.channel_id) : null))
    labelFor = (key) => channelLabel(key, channelNameById)
  } else if (groupBy === 'category') {
    buckets = groupByKey(rows, (row) => row.category)
    labelFor = categoryLabel
  } else {
    buckets = groupByKey(rows, (row) => (row.context_id != null ? String(row.context_id) : null))
    labelFor = (key) => contextLabel(key, contextNameById)
  }

  const sortedKeys = sortWithUnclassifiedLast([...buckets.keys()])
  return sortedKeys.map((key) => ({ key, label: labelFor(key), rows: buckets.get(key)! }))
}

export function distinctChannelIds(rows: Resource[]): string[] {
  const present = new Set(
    rows.map((row) => (row.channel_id != null ? String(row.channel_id) : UNCLASSIFIED)),
  )
  return sortWithUnclassifiedLast([...present])
}

export function distinctCategories(rows: Resource[]): string[] {
  const present = new Set(rows.map((row) => row.category ?? UNCLASSIFIED))
  return sortWithUnclassifiedLast([...present])
}

export function distinctContextIds(rows: Resource[]): string[] {
  const present = new Set(
    rows.map((row) => (row.context_id != null ? String(row.context_id) : UNCLASSIFIED)),
  )
  return sortWithUnclassifiedLast([...present])
}
