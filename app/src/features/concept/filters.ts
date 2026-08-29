import type { ConceptRow } from './hooks'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type ConceptGroupBy = 'none' | 'part_of_speech' | 'coverage'

export type ConceptFilterState = {
  search: string
  partOfSpeech: string
  coverage: string
  groupBy: ConceptGroupBy
}

export const defaultConceptFilterState: ConceptFilterState = {
  search: '',
  partOfSpeech: ALL,
  coverage: ALL,
  groupBy: 'none',
}

/** Which languages have a word for this concept — the main gap-finding axis. */
export type Coverage = 'both' | 'ja_only' | 'de_only' | 'none'

export function coverageOf(row: ConceptRow): Coverage {
  if (row.ja.length > 0 && row.de.length > 0) return 'both'
  if (row.ja.length > 0) return 'ja_only'
  if (row.de.length > 0) return 'de_only'
  return 'none'
}

const COVERAGE_ORDER: Coverage[] = ['both', 'ja_only', 'de_only', 'none']

const COVERAGE_LABELS: Record<string, string> = {
  both: 'Japanese + German',
  ja_only: 'Japanese only',
  de_only: 'German only',
  none: 'No words',
}

export function coverageLabel(value: string): string {
  return COVERAGE_LABELS[value] ?? value
}

export function partOfSpeechLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function applyConceptFilters(
  rows: ConceptRow[],
  filters: ConceptFilterState,
): ConceptRow[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.partOfSpeech !== ALL) {
      const key = row.concept.part_of_speech ?? UNCLASSIFIED
      if (key !== filters.partOfSpeech) return false
    }
    if (filters.coverage !== ALL && coverageOf(row) !== filters.coverage) return false
    if (search) {
      const haystack = [row.concept.gloss, ...row.ja.map((w) => w.word), ...row.de.map((w) => w.word)]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export type ConceptGroup = { key: string; label: string; rows: ConceptRow[] }

function groupByKey(
  rows: ConceptRow[],
  keyFor: (row: ConceptRow) => string | null,
): Map<string, ConceptRow[]> {
  const buckets = new Map<string, ConceptRow[]>()
  for (const row of rows) {
    const key = keyFor(row) ?? UNCLASSIFIED
    const bucket = buckets.get(key)
    if (bucket) bucket.push(row)
    else buckets.set(key, [row])
  }
  return buckets
}

function sortWithUnclassifiedLast(keys: string[]): string[] {
  const known = keys.filter((k) => k !== UNCLASSIFIED).sort()
  return [...known, ...(keys.includes(UNCLASSIFIED) ? [UNCLASSIFIED] : [])]
}

export function groupConceptsBy(rows: ConceptRow[], groupBy: ConceptGroupBy): ConceptGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All concepts', rows }]
  }

  if (groupBy === 'coverage') {
    const buckets = groupByKey(rows, coverageOf)
    return COVERAGE_ORDER.filter((k) => buckets.has(k)).map((key) => ({
      key,
      label: coverageLabel(key),
      rows: buckets.get(key)!,
    }))
  }

  const buckets = groupByKey(rows, (row) => row.concept.part_of_speech)
  return sortWithUnclassifiedLast([...buckets.keys()]).map((key) => ({
    key,
    label: partOfSpeechLabel(key),
    rows: buckets.get(key)!,
  }))
}

export function distinctPartOfSpeechValues(rows: ConceptRow[]): string[] {
  const present = new Set(rows.map((row) => row.concept.part_of_speech ?? UNCLASSIFIED))
  return sortWithUnclassifiedLast([...present])
}

export function distinctCoverageValues(rows: ConceptRow[]): string[] {
  const present = new Set(rows.map(coverageOf))
  return COVERAGE_ORDER.filter((k) => present.has(k))
}
