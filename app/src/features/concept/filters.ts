import type { ConceptRow } from './hooks'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type ConceptGroupBy = 'none' | 'category' | 'tier' | 'part_of_speech'

export type ConceptFilterState = {
  search: string
  /** Slug of a top-level category. */
  topCategory: string
  tier: string
  /** A language code: show only concepts with no word in it. */
  missingIn: string
  partOfSpeech: string
  groupBy: ConceptGroupBy
}

export const defaultConceptFilterState: ConceptFilterState = {
  search: '',
  topCategory: ALL,
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

export function applyConceptFilters(rows: ConceptRow[], filters: ConceptFilterState): ConceptRow[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.topCategory !== ALL && (row.topCategory?.slug ?? UNCLASSIFIED) !== filters.topCategory) {
      return false
    }
    if (filters.tier !== ALL && String(row.concept.tier ?? UNCLASSIFIED) !== filters.tier) return false
    if (filters.partOfSpeech !== ALL) {
      if ((row.concept.part_of_speech ?? UNCLASSIFIED) !== filters.partOfSpeech) return false
    }
    // The gap-finder: concepts this language has no word for yet.
    if (filters.missingIn !== ALL && (row.wordsByLanguage.get(filters.missingIn)?.length ?? 0) > 0) {
      return false
    }
    if (search) {
      const words = [...row.wordsByLanguage.values()].flat().map((w) => w.word)
      const haystack = [row.concept.gloss, row.category?.name ?? '', ...words].join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export type ConceptGroup = { key: string; label: string; rows: ConceptRow[] }

function bucket(rows: ConceptRow[], keyFor: (row: ConceptRow) => string) {
  const buckets = new Map<string, ConceptRow[]>()
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

export function groupConceptsBy(rows: ConceptRow[], groupBy: ConceptGroupBy): ConceptGroup[] {
  if (groupBy === 'none') return [{ key: 'all', label: 'All concepts', rows }]

  if (groupBy === 'category') {
    // Keep the syllabus order rather than sorting alphabetically.
    const buckets = bucket(rows, (r) => r.topCategory?.slug ?? UNCLASSIFIED)
    const order = new Map<string, number>()
    for (const row of rows) {
      const slug = row.topCategory?.slug ?? UNCLASSIFIED
      if (!order.has(slug)) order.set(slug, row.topCategory?.sort_order ?? Number.MAX_SAFE_INTEGER)
    }
    return [...buckets.keys()]
      .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
      .map((key) => ({
        key,
        label: buckets.get(key)![0].topCategory?.name ?? 'Outside the syllabus',
        rows: buckets.get(key)!,
      }))
  }

  if (groupBy === 'tier') {
    const buckets = bucket(rows, (r) => String(r.concept.tier ?? UNCLASSIFIED))
    return unclassifiedLast([...buckets.keys()]).map((key) => ({
      key,
      label: tierLabel(key),
      rows: buckets.get(key)!,
    }))
  }

  const buckets = bucket(rows, (r) => r.concept.part_of_speech ?? UNCLASSIFIED)
  return unclassifiedLast([...buckets.keys()]).map((key) => ({
    key,
    label: partOfSpeechLabel(key),
    rows: buckets.get(key)!,
  }))
}

export function distinctTopCategories(rows: ConceptRow[]): { slug: string; name: string }[] {
  const seen = new Map<string, { slug: string; name: string; order: number }>()
  for (const row of rows) {
    const slug = row.topCategory?.slug ?? UNCLASSIFIED
    if (seen.has(slug)) continue
    seen.set(slug, {
      slug,
      name: row.topCategory?.name ?? 'Outside the syllabus',
      order: row.topCategory?.sort_order ?? Number.MAX_SAFE_INTEGER,
    })
  }
  return [...seen.values()].sort((a, b) => a.order - b.order).map(({ slug, name }) => ({ slug, name }))
}

export function distinctTiers(rows: ConceptRow[]): string[] {
  const present = new Set(rows.map((r) => String(r.concept.tier ?? UNCLASSIFIED)))
  return unclassifiedLast([...present])
}

export function distinctPartOfSpeechValues(rows: ConceptRow[]): string[] {
  const present = new Set(rows.map((r) => r.concept.part_of_speech ?? UNCLASSIFIED))
  return unclassifiedLast([...present])
}
