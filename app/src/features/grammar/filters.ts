import type { GrammarPoint } from './api'

const CATEGORY_LABELS: Record<string, string> = {
  overview: 'Overview',
  particle: 'Particles',
  verb: 'Verbs',
  adjective: 'Adjectives',
  pattern: 'Patterns',
  filler: 'Fillers',
  counter: 'Counters',
  'question-word': 'Question Words',
  conjunction: 'Conjunctions',
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

export function applyGrammarSearch(rows: GrammarPoint[], search: string): GrammarPoint[] {
  const q = search.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    [row.title, row.content].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
}

export type GrammarGroup = { key: string; label: string; rows: GrammarPoint[] }

/** Groups by category, ordered by each category's minimum folder_order (mirrors the source folder structure). */
export function groupGrammarByCategory(rows: GrammarPoint[]): GrammarGroup[] {
  const buckets = new Map<string, GrammarPoint[]>()
  for (const row of rows) {
    const bucket = buckets.get(row.category)
    if (bucket) {
      bucket.push(row)
    } else {
      buckets.set(row.category, [row])
    }
  }

  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.sort_order - b.sort_order)
  }

  const sortedCategories = [...buckets.keys()].sort((a, b) => {
    const aOrder = Math.min(...buckets.get(a)!.map((r) => r.folder_order))
    const bOrder = Math.min(...buckets.get(b)!.map((r) => r.folder_order))
    return aOrder - bOrder
  })

  return sortedCategories.map((category) => ({
    key: category,
    label: categoryLabel(category),
    rows: buckets.get(category)!,
  }))
}
