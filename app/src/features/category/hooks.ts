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

export type CategoryNode = { category: Category; depth: number }

/** Every category in tree order (each followed by its descendants), with depth from 0. */
export function categoryTree(list: Category[]): CategoryNode[] {
  const bySortOrder = (a: Category, b: Category) => a.sort_order - b.sort_order
  const walk = (parentId: number | null, depth: number): CategoryNode[] =>
    list
      .filter((c) => c.parent_id === parentId)
      .sort(bySortOrder)
      .flatMap((category) => [{ category, depth }, ...walk(category.id, depth + 1)])
  return walk(null, 0)
}

export type CategoryLookup = {
  byId: Map<number, Category>
  /** A category and its ancestors, root first — empty for an unknown id. */
  pathOf: (id: number | null) => Category[]
  tree: CategoryNode[]
}

export function useCategoryLookup(): CategoryLookup {
  const { data } = useCategoryList()

  return useMemo(() => {
    const list = data ?? []
    const byId = new Map(list.map((c) => [c.id, c]))
    return {
      byId,
      pathOf: (id) => {
        const path: Category[] = []
        for (let c = id != null ? byId.get(id) : undefined; c; c = c.parent_id != null ? byId.get(c.parent_id) : undefined) {
          path.unshift(c)
        }
        return path
      },
      tree: categoryTree(list),
    }
  }, [data])
}

/**
 * Filter options for the categories on the given paths, indented as a tree.
 * Picking a category matches everything beneath it, so a root narrows broadly
 * and a leaf narrowly.
 */
export function categoryFilterOptions(tree: CategoryNode[], paths: Category[][]) {
  const present = new Set(paths.flat().map((c) => c.id))
  return tree
    .filter((node) => present.has(node.category.id))
    .map((node) => ({ value: node.category.slug, label: '\u00a0\u00a0\u00a0'.repeat(node.depth) + node.category.name }))
}

export type CategorySummary = {
  category: Category
  /** 0 for a root category, 1 for one nested under it, and so on. */
  depth: number
  /** Includes the meanings of every category beneath this one. */
  meanings: number
  /** Meanings with at least one word, per language code. */
  coveredByLanguage: Map<string, number>
}

/**
 * Every category with meaning counts and per-language coverage, in tree order
 * — the "what should I study next" view.
 */
export function useCategorySummaries(): CategorySummary[] {
  const { data: meanings } = useMeaningList()
  const { data: words } = useWordListAllLanguages()
  const { tree, pathOf } = useCategoryLookup()

  return useMemo(() => {
    const languagesByMeaning = new Map<number, Set<string>>()
    for (const word of words ?? []) {
      if (word.meaning_id == null) continue
      const set = languagesByMeaning.get(word.meaning_id)
      if (set) set.add(word.language)
      else languagesByMeaning.set(word.meaning_id, new Set([word.language]))
    }

    const summaries = new Map<number, CategorySummary>(
      tree.map(({ category, depth }) => [category.id, { category, depth, meanings: 0, coveredByLanguage: new Map() }]),
    )

    // A meaning counts toward its own category and every ancestor of it.
    for (const meaning of meanings ?? []) {
      for (const category of pathOf(meaning.category_id)) {
        const summary = summaries.get(category.id)
        if (!summary) continue
        summary.meanings += 1
        for (const code of languagesByMeaning.get(meaning.id) ?? []) {
          summary.coveredByLanguage.set(code, (summary.coveredByLanguage.get(code) ?? 0) + 1)
        }
      }
    }

    return tree.map(({ category }) => summaries.get(category.id)!)
  }, [tree, pathOf, meanings, words])
}
