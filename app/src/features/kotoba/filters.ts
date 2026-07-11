import type { Kotoba } from './api'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type KotobaGroupBy = 'none' | 'context' | 'part_of_speech' | 'sub_part_of_speech' | 'has_kanji'

export type KotobaFilterState = {
  search: string
  contextId: string
  partOfSpeech: string
  subPartOfSpeech: string
  hasKanji: string
  groupBy: KotobaGroupBy
}

export const defaultKotobaFilterState: KotobaFilterState = {
  search: '',
  contextId: ALL,
  partOfSpeech: ALL,
  subPartOfSpeech: ALL,
  hasKanji: ALL,
  groupBy: 'none',
}

function matchesSingleSelect(value: string | null, selected: string): boolean {
  if (selected === ALL) return true
  const key = value ?? UNCLASSIFIED
  return key === selected
}

function hasKanjiKey(value: boolean | null): string | null {
  if (value === null) return null
  return value ? 'true' : 'false'
}

export function applyKotobaFilters(rows: Kotoba[], filters: KotobaFilterState): Kotoba[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    const contextKey = row.context_id != null ? String(row.context_id) : null
    if (!matchesSingleSelect(contextKey, filters.contextId)) return false
    if (!matchesSingleSelect(row.part_of_speech, filters.partOfSpeech)) return false
    if (!matchesSingleSelect(row.sub_part_of_speech, filters.subPartOfSpeech)) return false
    if (!matchesSingleSelect(hasKanjiKey(row.has_kanji), filters.hasKanji)) return false
    if (search) {
      const haystack = [row.word, row.reading, ...(row.meanings ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export function hasKanjiLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value === 'true' ? 'Has kanji' : 'Kana only'
}

export function partOfSpeechLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function subPartOfSpeechLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value
}

export function contextLabel(value: string, contextNameById: Map<number, string>): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no context)'
  const name = contextNameById.get(Number(value))
  return name ?? value
}

export type KotobaGroup = { key: string; label: string; rows: Kotoba[] }

function groupByKey(
  rows: Kotoba[],
  keyFor: (row: Kotoba) => string | null,
): Map<string, Kotoba[]> {
  const buckets = new Map<string, Kotoba[]>()
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

function sortWithUnclassifiedLast(keys: string[]): string[] {
  const known = keys.filter((k) => k !== UNCLASSIFIED).sort()
  const hasUnclassified = keys.includes(UNCLASSIFIED)
  return [...known, ...(hasUnclassified ? [UNCLASSIFIED] : [])]
}

export function groupKotobaBy(
  rows: Kotoba[],
  groupBy: KotobaGroupBy,
  contextNameById: Map<number, string>,
): KotobaGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All kotoba', rows }]
  }

  let buckets: Map<string, Kotoba[]>
  let labelFor: (key: string) => string

  if (groupBy === 'context') {
    buckets = groupByKey(rows, (row) => (row.context_id != null ? String(row.context_id) : null))
    labelFor = (key) => contextLabel(key, contextNameById)
  } else if (groupBy === 'part_of_speech') {
    buckets = groupByKey(rows, (row) => row.part_of_speech)
    labelFor = partOfSpeechLabel
  } else if (groupBy === 'sub_part_of_speech') {
    buckets = groupByKey(rows, (row) => row.sub_part_of_speech)
    labelFor = subPartOfSpeechLabel
  } else {
    buckets = groupByKey(rows, (row) => hasKanjiKey(row.has_kanji))
    labelFor = hasKanjiLabel
  }

  const sortedKeys = sortWithUnclassifiedLast([...buckets.keys()])
  return sortedKeys.map((key) => ({
    key,
    label: labelFor(key),
    rows: buckets.get(key)!,
  }))
}

export function distinctFieldValues(rows: Kotoba[], field: 'part_of_speech' | 'sub_part_of_speech'): string[] {
  const present = new Set(rows.map((row) => row[field] ?? UNCLASSIFIED))
  return sortWithUnclassifiedLast([...present])
}

export function distinctContextIds(rows: Kotoba[]): string[] {
  const present = new Set(rows.map((row) => (row.context_id != null ? String(row.context_id) : UNCLASSIFIED)))
  return sortWithUnclassifiedLast([...present])
}
