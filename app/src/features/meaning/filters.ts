import type { MeaningRow } from './hooks'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type MeaningGroupBy = 'none' | 'category' | 'tier' | 'part_of_speech'

export type MeaningFilterState = {
  search: string
  /** Slug of a category at any level; matches everything beneath it. */
  category: string
  tier: string
  /** A language code: show only meanings with no word in it. */
  missingIn: string
  partOfSpeech: string
  groupBy: MeaningGroupBy
}

export const defaultMeaningFilterState: MeaningFilterState = {
  search: '',
  category: ALL,
  tier: ALL,
  missingIn: ALL,
  partOfSpeech: ALL,
  groupBy: 'none',
}

export function partOfSpeechLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function tierLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'No tier'
  return `Tier ${value}`
}

export function applyMeaningFilters(rows: MeaningRow[], filters: MeaningFilterState): MeaningRow[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.category === UNCLASSIFIED && row.path.length > 0) return false
    if (filters.category !== ALL && filters.category !== UNCLASSIFIED && !row.path.some((c) => c.slug === filters.category)) {
      return false
    }
    if (filters.tier !== ALL && String(row.meaning.tier ?? UNCLASSIFIED) !== filters.tier) return false
    if (filters.partOfSpeech !== ALL) {
      if ((row.meaning.part_of_speech ?? UNCLASSIFIED) !== filters.partOfSpeech) return false
    }
    // The gap-finder: meanings this language has no word for yet.
    if (filters.missingIn !== ALL && (row.wordsByLanguage.get(filters.missingIn)?.length ?? 0) > 0) {
      return false
    }
    if (search) {
      const words = [...row.wordsByLanguage.values()].flat().map((w) => w.word)
      const haystack = [row.meaning.gloss, row.category?.name ?? '', ...words].join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export type MeaningGroup = { key: string; label: string; rows: MeaningRow[] }

function bucket(rows: MeaningRow[], keyFor: (row: MeaningRow) => string) {
  const buckets = new Map<string, MeaningRow[]>()
  for (const row of rows) {
    const key = keyFor(row)
    const existing = buckets.get(key)
    if (existing) existing.push(row)
    else buckets.set(key, [row])
  }
  return buckets
}

function unclassifiedLast(keys: string[]): string[] {
  const known = keys.filter((k) => k !== UNCLASSIFIED).sort()
  return [...known, ...(keys.includes(UNCLASSIFIED) ? [UNCLASSIFIED] : [])]
}

export function groupMeaningsBy(rows: MeaningRow[], groupBy: MeaningGroupBy): MeaningGroup[] {
  if (groupBy === 'none') return [{ key: 'all', label: 'All meanings', rows }]

  if (groupBy === 'category') {
    // One section per root category, in syllabus order rather than alphabetical.
    const buckets = bucket(rows, (r) => r.path[0]?.slug ?? UNCLASSIFIED)
    const order = new Map<string, number>()
    for (const row of rows) {
      const slug = row.path[0]?.slug ?? UNCLASSIFIED
      if (!order.has(slug)) order.set(slug, row.path[0]?.sort_order ?? Number.MAX_SAFE_INTEGER)
    }
    return [...buckets.keys()]
      .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
      .map((key) => ({
        key,
        label: buckets.get(key)![0].path[0]?.name ?? 'Outside the syllabus',
        rows: buckets.get(key)!,
      }))
  }

  if (groupBy === 'tier') {
    const buckets = bucket(rows, (r) => String(r.meaning.tier ?? UNCLASSIFIED))
    return unclassifiedLast([...buckets.keys()]).map((key) => ({
      key,
      label: tierLabel(key),
      rows: buckets.get(key)!,
    }))
  }

  const buckets = bucket(rows, (r) => r.meaning.part_of_speech ?? UNCLASSIFIED)
  return unclassifiedLast([...buckets.keys()]).map((key) => ({
    key,
    label: partOfSpeechLabel(key),
    rows: buckets.get(key)!,
  }))
}

export function distinctTiers(rows: MeaningRow[]): string[] {
  const present = new Set(rows.map((r) => String(r.meaning.tier ?? UNCLASSIFIED)))
  return unclassifiedLast([...present])
}

export function distinctPartOfSpeechValues(rows: MeaningRow[]): string[] {
  const present = new Set(rows.map((r) => r.meaning.part_of_speech ?? UNCLASSIFIED))
  return unclassifiedLast([...present])
}
