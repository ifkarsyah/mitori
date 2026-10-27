import type { Source } from '@/features/word/api'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type SourceGroupBy = 'none' | 'scene'

export type SourceFilterState = {
  search: string
  sceneId: string
  groupBy: SourceGroupBy
}

export const defaultSourceFilterState: SourceFilterState = {
  search: '',
  sceneId: ALL,
  groupBy: 'none',
}

export function applySourceFilters(rows: Source[], filters: SourceFilterState): Source[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.sceneId !== ALL) {
      const key = row.scene_id != null ? String(row.scene_id) : UNCLASSIFIED
      if (key !== filters.sceneId) return false
    }
    if (search) {
      const haystack = [row.name, row.url].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export function sourceSceneLabel(value: string, sceneNameById: Map<number, string>): string {
  if (value === UNCLASSIFIED) return 'No scene'
  const name = sceneNameById.get(Number(value))
  return name ?? value
}

export type SourceGroup = { key: string; label: string; rows: Source[] }

export function groupSourcesBy(
  rows: Source[],
  groupBy: SourceGroupBy,
  sceneNameById: Map<number, string>,
): SourceGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All sources', rows }]
  }

  const buckets = new Map<string, Source[]>()
  for (const row of rows) {
    const key = row.scene_id != null ? String(row.scene_id) : UNCLASSIFIED
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
    label: sourceSceneLabel(key, sceneNameById),
    rows: buckets.get(key)!,
  }))
}

export function distinctSourceSceneIds(rows: Source[]): string[] {
  const present = new Set(
    rows.map((row) => (row.scene_id != null ? String(row.scene_id) : UNCLASSIFIED)),
  )
  const known = [...present].filter((k) => k !== UNCLASSIFIED).sort()
  const hasUnclassified = present.has(UNCLASSIFIED)
  return [...known, ...(hasUnclassified ? [UNCLASSIFIED] : [])]
}
