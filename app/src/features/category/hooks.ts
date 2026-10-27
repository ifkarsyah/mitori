import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCategoryList, type Category } from './api'
import { useMeaningList, useWordListAllLanguages } from '@/features/word/hooks'

export function useCategoryList() {
  return useQuery({
    queryKey: ['category', 'list'],
    queryFn: fetchCategoryList,
    staleTime: Infinity,
  })
}

export type CategoryLookup = {
  byId: Map<number, Category>
  /** The top-level ancestor of a category — itself when it has no parent. */
  topLevelOf: (id: number | null) => Category | undefined
  topLevel: Category[]
}

export function useCategoryLookup(): CategoryLookup {
  const { data } = useCategoryList()

  return useMemo(() => {
    const list = data ?? []
    const byId = new Map(list.map((c) => [c.id, c]))
    return {
      byId,
      topLevelOf: (id) => {
        if (id == null) return undefined
        const category = byId.get(id)
        if (!category) return undefined
        return category.parent_id != null ? byId.get(category.parent_id) ?? category : category
      },
      topLevel: list.filter((c) => c.parent_id == null),
    }
  }, [data])
}

export type CategorySummary = {
  category: Category
  /** Leaf categories nested under this one, empty for a leaf. */
  children: Category[]
  meanings: number
  /** Meanings with at least one word, per language code. */
  coveredByLanguage: Map<string, number>
}

/**
 * Top-level categories with meaning counts and per-language coverage — the
 * "what should I study next" view.
 */
export function useCategorySummaries(): CategorySummary[] {
  const { data: categories } = useCategoryList()
  const { data: meanings } = useMeaningList()
  const { data: words } = useWordListAllLanguages()

  return useMemo(() => {
    const list = categories ?? []
    const byId = new Map(list.map((c) => [c.id, c]))
    const topLevelIdOf = (id: number | null) => {
      if (id == null) return null
      const category = byId.get(id)
      if (!category) return null
      return category.parent_id ?? category.id
    }

    const languagesByMeaning = new Map<number, Set<string>>()
    for (const word of words ?? []) {
      if (word.meaning_id == null) continue
      const set = languagesByMeaning.get(word.meaning_id)
      if (set) set.add(word.language)
      else languagesByMeaning.set(word.meaning_id, new Set([word.language]))
    }

    const summaries = new Map<number, CategorySummary>()
    for (const category of list) {
      if (category.parent_id != null) continue
      summaries.set(category.id, {
        category,
        children: list.filter((c) => c.parent_id === category.id),
        meanings: 0,
        coveredByLanguage: new Map(),
      })
    }

    for (const meaning of meanings ?? []) {
      const topId = topLevelIdOf(meaning.category_id)
      if (topId == null) continue
      const summary = summaries.get(topId)
      if (!summary) continue
      summary.meanings += 1
      for (const code of languagesByMeaning.get(meaning.id) ?? []) {
        summary.coveredByLanguage.set(code, (summary.coveredByLanguage.get(code) ?? 0) + 1)
      }
    }

    return [...summaries.values()].sort((a, b) => a.category.sort_order - b.category.sort_order)
  }, [categories, meanings, words])
}
