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
  /** 0 for a top-level category, 1 for one nested under it. */
  depth: number
  /** For a top-level category, includes the meanings of its sub-categories. */
  meanings: number
  /** Meanings with at least one word, per language code. */
  coveredByLanguage: Map<string, number>
}

/**
 * Every category with meaning counts and per-language coverage, in tree order
 * (each top-level category followed by its sub-categories) — the "what should
 * I study next" view.
 */
export function useCategorySummaries(): CategorySummary[] {
  const { data: categories } = useCategoryList()
  const { data: meanings } = useMeaningList()
  const { data: words } = useWordListAllLanguages()

  return useMemo(() => {
    const list = categories ?? []
    const byId = new Map(list.map((c) => [c.id, c]))

    const languagesByMeaning = new Map<number, Set<string>>()
    for (const word of words ?? []) {
      if (word.meaning_id == null) continue
      const set = languagesByMeaning.get(word.meaning_id)
      if (set) set.add(word.language)
      else languagesByMeaning.set(word.meaning_id, new Set([word.language]))
    }

    const summaries = new Map<number, CategorySummary>(
      list.map((category) => [
        category.id,
        { category, depth: category.parent_id == null ? 0 : 1, meanings: 0, coveredByLanguage: new Map() },
      ]),
    )

    // A meaning counts toward its own category and, if that is nested, its parent.
    for (const meaning of meanings ?? []) {
      const category = meaning.category_id != null ? byId.get(meaning.category_id) : undefined
      if (!category) continue
      const ids = category.parent_id != null ? [category.id, category.parent_id] : [category.id]
      for (const id of ids) {
        const summary = summaries.get(id)
        if (!summary) continue
        summary.meanings += 1
        for (const code of languagesByMeaning.get(meaning.id) ?? []) {
          summary.coveredByLanguage.set(code, (summary.coveredByLanguage.get(code) ?? 0) + 1)
        }
      }
    }

    const bySortOrder = (a: Category, b: Category) => a.sort_order - b.sort_order
    return list
      .filter((c) => c.parent_id == null)
      .sort(bySortOrder)
      .flatMap((top) => [top, ...list.filter((c) => c.parent_id === top.id).sort(bySortOrder)])
      .map((c) => summaries.get(c.id)!)
  }, [categories, meanings, words])
}
