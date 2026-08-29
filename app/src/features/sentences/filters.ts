import type { EnrichedSentence } from './hooks'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type SentenceGroupBy = 'none' | 'level' | 'part_of_speech' | 'kana_type' | 'category'

export type SentenceFilterState = {
  search: string
  level: string
  partOfSpeech: string
  kanaType: string
  category: string
  groupBy: SentenceGroupBy
}

export const defaultSentenceFilterState: SentenceFilterState = {
  search: '',
  level: ALL,
  partOfSpeech: ALL,
  kanaType: ALL,
  category: ALL,
  groupBy: 'none',
}

function matchesSingleSelect(value: string | null, selected: string): boolean {
  if (selected === ALL) return true
  const key = value ?? UNCLASSIFIED
  return key === selected
}

export function applySentenceFilters(
  rows: EnrichedSentence[],
  filters: SentenceFilterState,
): EnrichedSentence[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (!matchesSingleSelect(row.level, filters.level)) return false
    if (!matchesSingleSelect(row.partOfSpeech, filters.partOfSpeech)) return false
    if (!matchesSingleSelect(row.kanaType, filters.kanaType)) return false
    if (!matchesSingleSelect(row.category, filters.category)) return false
    if (search) {
      const haystack = [row.sentence, row.meaning, row.word, row.wordReading]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

const JLPT_ORDER = ['n5', 'n4', 'n3', 'n2', 'n1']
const KANA_TYPE_ORDER = ['kanji', 'hiragana', 'katakana']

export function levelLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no JLPT level)'
  return value.toUpperCase()
}

export function partOfSpeechLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function kanaTypeLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function categoryLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no context)'
  return value
}

export type SentenceGroup = { key: string; label: string; rows: EnrichedSentence[] }

function groupByKey(
  rows: EnrichedSentence[],
  keyFor: (row: EnrichedSentence) => string | null,
): Map<string, EnrichedSentence[]> {
  const buckets = new Map<string, EnrichedSentence[]>()
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

function sortByDomainOrder(keys: string[], order: string[]): string[] {
  const known = order.filter((k) => keys.includes(k))
  const unknown = keys.filter((k) => !order.includes(k) && k !== UNCLASSIFIED).sort()
  const hasUnclassified = keys.includes(UNCLASSIFIED)
  return [...known, ...unknown, ...(hasUnclassified ? [UNCLASSIFIED] : [])]
}

export function groupSentencesBy(
  rows: EnrichedSentence[],
  groupBy: SentenceGroupBy,
): SentenceGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All sentences', rows }]
  }

  let buckets: Map<string, EnrichedSentence[]>
  let labelFor: (key: string) => string
  let sortedKeys: string[]

  if (groupBy === 'level') {
    buckets = groupByKey(rows, (row) => row.level)
    labelFor = levelLabel
    sortedKeys = sortByDomainOrder([...buckets.keys()], JLPT_ORDER)
  } else if (groupBy === 'part_of_speech') {
    buckets = groupByKey(rows, (row) => row.partOfSpeech)
    labelFor = partOfSpeechLabel
    sortedKeys = sortWithUnclassifiedLast([...buckets.keys()])
  } else if (groupBy === 'category') {
    buckets = groupByKey(rows, (row) => row.category)
    labelFor = categoryLabel
    sortedKeys = sortWithUnclassifiedLast([...buckets.keys()])
  } else {
    buckets = groupByKey(rows, (row) => row.kanaType)
    labelFor = kanaTypeLabel
    sortedKeys = sortByDomainOrder([...buckets.keys()], KANA_TYPE_ORDER)
  }

  return sortedKeys.map((key) => ({
    key,
    label: labelFor(key),
    rows: buckets.get(key)!,
  }))
}

export function distinctFieldValues(
  rows: EnrichedSentence[],
  field: 'level' | 'partOfSpeech' | 'kanaType' | 'category',
): string[] {
  const present = new Set(rows.map((row) => row[field] ?? UNCLASSIFIED))
  if (field === 'level') return sortByDomainOrder([...present], JLPT_ORDER)
  if (field === 'kanaType') return sortByDomainOrder([...present], KANA_TYPE_ORDER)
  return sortWithUnclassifiedLast([...present])
}
