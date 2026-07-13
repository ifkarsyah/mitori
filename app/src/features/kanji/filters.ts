import type { Kanji } from './api'

export const UNCLASSIFIED = '__unclassified__'
export const ALL = '__all__'

export type KanjiGroupBy = 'none' | 'grade' | 'jlpt' | 'cluster'

export type KanjiFilterState = {
  search: string
  jlpt: string
  grade: string
  cluster: string
  groupBy: KanjiGroupBy
}

export const defaultKanjiFilterState: KanjiFilterState = {
  search: '',
  jlpt: ALL,
  grade: ALL,
  cluster: ALL,
  groupBy: 'none',
}

function matchesSingleSelect(value: string | null, selected: string): boolean {
  if (selected === ALL) return true
  const key = value ?? UNCLASSIFIED
  return key === selected
}

export function applyKanjiFilters(rows: Kanji[], filters: KanjiFilterState): Kanji[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (!matchesSingleSelect(row.jlpt, filters.jlpt)) return false
    if (!matchesSingleSelect(row.grade, filters.grade)) return false
    if (!matchesSingleSelect(row.cluster, filters.cluster)) return false
    if (search) {
      const haystack = [row.character, ...(row.meanings ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

const GRADE_ORDER = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'j1', 'j2', 's1', 's2']
const JLPT_ORDER = ['n5', 'n4', 'n3', 'n2', 'n1']

const GRADE_LABELS: Record<string, string> = {
  e1: 'Grade 1',
  e2: 'Grade 2',
  e3: 'Grade 3',
  e4: 'Grade 4',
  e5: 'Grade 5',
  e6: 'Grade 6',
  j1: 'Junior High (during)',
  j2: 'Junior High (end)',
  s1: 'Senior High (during)',
  s2: 'Senior High (end)',
}

const JLPT_LABELS: Record<string, string> = {
  n5: 'N5',
  n4: 'N4',
  n3: 'N3',
  n2: 'N2',
  n1: 'N1',
}

export function gradeLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no grade)'
  return GRADE_LABELS[value] ?? value
}

export function jlptLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified (no JLPT level)'
  return JLPT_LABELS[value] ?? value.toUpperCase()
}

export function clusterLabel(value: string): string {
  if (value === UNCLASSIFIED) return 'Unclassified'
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function sortKeysByDomainOrder(keys: string[], order: string[]): string[] {
  const known = order.filter((k) => keys.includes(k))
  const unknown = keys.filter((k) => !order.includes(k) && k !== UNCLASSIFIED).sort()
  const hasUnclassified = keys.includes(UNCLASSIFIED)
  return [...known, ...unknown, ...(hasUnclassified ? [UNCLASSIFIED] : [])]
}

export type KanjiGroup = { key: string; label: string; rows: Kanji[] }

export function groupKanjiBy(rows: Kanji[], groupBy: KanjiGroupBy): KanjiGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All kanji', rows }]
  }

  const buckets = new Map<string, Kanji[]>()
  for (const row of rows) {
    const value = groupBy === 'grade' ? row.grade : groupBy === 'jlpt' ? row.jlpt : row.cluster
    const key = value ?? UNCLASSIFIED
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(row)
    } else {
      buckets.set(key, [row])
    }
  }

  const order = groupBy === 'grade' ? GRADE_ORDER : groupBy === 'jlpt' ? JLPT_ORDER : []
  const labelFor = groupBy === 'grade' ? gradeLabel : groupBy === 'jlpt' ? jlptLabel : clusterLabel
  const sortedKeys = sortKeysByDomainOrder([...buckets.keys()], order)

  return sortedKeys.map((key) => ({
    key,
    label: labelFor(key),
    rows: buckets.get(key)!,
  }))
}

/** Distinct grade/jlpt/cluster values present in the data, for building filter dropdown options. */
export function distinctFieldValues(rows: Kanji[], field: 'grade' | 'jlpt' | 'cluster'): string[] {
  const order = field === 'grade' ? GRADE_ORDER : field === 'jlpt' ? JLPT_ORDER : []
  const present = new Set(rows.map((row) => row[field] ?? UNCLASSIFIED))
  return sortKeysByDomainOrder([...present], order)
}
