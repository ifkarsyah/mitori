import type { Kotoba } from './api'
import type { ConceptCategory } from '@/features/concept/hooks'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type KotobaGroupBy =
  | 'none'
  | 'category'
  | 'part_of_speech'
  | 'sub_part_of_speech'
  | 'kana_type'
  | 'level'

export type KotobaFilterState = {
  search: string
  /** Slug of a top-level category, resolved through the word's concept. */
  categorySlug: string
  partOfSpeech: string
  subPartOfSpeech: string
  kana_type: string
  level: string
  groupBy: KotobaGroupBy
}

export const defaultKotobaFilterState: KotobaFilterState = {
  search: '',
  categorySlug: ALL,
  partOfSpeech: ALL,
  subPartOfSpeech: ALL,
  kana_type: ALL,
  level: ALL,
  groupBy: 'none',
}

function matchesSingleSelect(value: string | null, selected: string): boolean {
  if (selected === ALL) return true
  const key = value ?? UNCLASSIFIED
  return key === selected
}

export function applyKotobaFilters(
  rows: Kotoba[],
  filters: KotobaFilterState,
  categoryOfConcept: Map<number, ConceptCategory>,
): Kotoba[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.categorySlug !== ALL) {
      const top = row.concept_id != null ? categoryOfConcept.get(row.concept_id)?.top : undefined
      if ((top?.slug ?? UNCLASSIFIED) !== filters.categorySlug) return false
    }
    if (!matchesSingleSelect(row.part_of_speech, filters.partOfSpeech)) return false
    if (!matchesSingleSelect(row.sub_part_of_speech, filters.subPartOfSpeech)) return false
    if (!matchesSingleSelect(row.kana_type, filters.kana_type)) return false
    if (!matchesSingleSelect(row.level, filters.level)) return false
    if (search) {
      const haystack = [row.word, row.reading, row.plural, ...(row.meanings ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

const KANA_TYPE_ORDER = ['kanji', 'hiragana', 'katakana']

export function kanaTypeLabel(value: string): string {
  // Non-Japanese words have no kana type at all, so "—" reads better than
  // "Unclassified", which implies a missing value that ought to be filled in.
  if (value === UNCLASSIFIED) return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}


export function partOfSpeechLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function subPartOfSpeechLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value
}

// Every scale runs easiest-first, so one ordering serves JLPT, CEFR and HSK.
const LEVEL_ORDER = ['n5', 'n4', 'n3', 'n2', 'n1', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6']

export function levelLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no level)'
  return value.toUpperCase()
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

function sortByDomainOrder(keys: string[], order: string[]): string[] {
  const known = order.filter((k) => keys.includes(k))
  const unknown = keys.filter((k) => !order.includes(k) && k !== UNCLASSIFIED).sort()
  const hasUnclassified = keys.includes(UNCLASSIFIED)
  return [...known, ...unknown, ...(hasUnclassified ? [UNCLASSIFIED] : [])]
}

export function groupKotobaBy(
  rows: Kotoba[],
  groupBy: KotobaGroupBy,
  categoryOfConcept: Map<number, ConceptCategory>,
): KotobaGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All kotoba', rows }]
  }

  let buckets: Map<string, Kotoba[]>
  let labelFor: (key: string) => string
  let sortedKeys: string[]

  if (groupBy === 'category') {
    buckets = groupByKey(rows, (row) =>
      row.concept_id != null ? categoryOfConcept.get(row.concept_id)?.top?.name ?? null : null,
    )
    labelFor = (key) => (key === UNCLASSIFIED ? 'Outside the syllabus' : key)
    sortedKeys = sortWithUnclassifiedLast([...buckets.keys()])
  } else if (groupBy === 'part_of_speech') {
    buckets = groupByKey(rows, (row) => row.part_of_speech)
    labelFor = partOfSpeechLabel
    sortedKeys = sortWithUnclassifiedLast([...buckets.keys()])
  } else if (groupBy === 'sub_part_of_speech') {
    buckets = groupByKey(rows, (row) => row.sub_part_of_speech)
    labelFor = subPartOfSpeechLabel
    sortedKeys = sortWithUnclassifiedLast([...buckets.keys()])
  } else if (groupBy === 'level') {
    buckets = groupByKey(rows, (row) => row.level)
    labelFor = levelLabel
    sortedKeys = sortByDomainOrder([...buckets.keys()], LEVEL_ORDER)
  } else {
    buckets = groupByKey(rows, (row) => row.kana_type)
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
  rows: Kotoba[],
  field: 'part_of_speech' | 'sub_part_of_speech',
): string[] {
  const present = new Set(rows.map((row) => row[field] ?? UNCLASSIFIED))
  return sortWithUnclassifiedLast([...present])
}

export function distinctLevelValues(rows: Kotoba[]): string[] {
  const present = new Set(rows.map((row) => row.level ?? UNCLASSIFIED))
  return sortByDomainOrder([...present], LEVEL_ORDER)
}

export function distinctKanaTypeValues(rows: Kotoba[]): string[] {
  const present = new Set(rows.map((row) => row.kana_type ?? UNCLASSIFIED))
  return sortByDomainOrder([...present], KANA_TYPE_ORDER)
}


