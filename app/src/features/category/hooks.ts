import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCategoryList, type Category } from './api'

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
