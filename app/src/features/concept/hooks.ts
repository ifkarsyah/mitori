import { useMemo } from 'react'
import { useConceptList, useKotobaListAllLanguages } from '@/features/kotoba/hooks'
import { useCategoryLookup } from '@/features/category/hooks'
import type { Category } from '@/features/category/api'
import type { Concept, Kotoba } from '@/features/kotoba/api'

export { useConceptList, useConceptById, useKotobaForConcept } from '@/features/kotoba/hooks'

/** A concept with its category and the words realizing it, keyed by language. */
export type ConceptRow = {
  concept: Concept
  category: Category | undefined
  topCategory: Category | undefined
  wordsByLanguage: Map<string, Kotoba[]>
}

export function useConceptRows() {
  const conceptQuery = useConceptList()
  // Deliberately unscoped: the concept view exists to compare languages
  // side by side, so filtering it to the active language would defeat it.
  const { data: kotoba } = useKotobaListAllLanguages()
  const categories = useCategoryLookup()

  const rows = useMemo<ConceptRow[]>(() => {
    if (!conceptQuery.data) return []

    const wordsByConcept = new Map<number, Kotoba[]>()
    for (const word of kotoba ?? []) {
      if (word.concept_id == null) continue
      const bucket = wordsByConcept.get(word.concept_id)
      if (bucket) bucket.push(word)
      else wordsByConcept.set(word.concept_id, [word])
    }

    return conceptQuery.data.map((concept) => {
      const byLanguage = new Map<string, Kotoba[]>()
      for (const word of wordsByConcept.get(concept.id) ?? []) {
        const bucket = byLanguage.get(word.language)
        if (bucket) bucket.push(word)
        else byLanguage.set(word.language, [word])
      }
      return {
        concept,
        category: concept.category_id != null ? categories.byId.get(concept.category_id) : undefined,
        topCategory: categories.topLevelOf(concept.category_id),
        wordsByLanguage: byLanguage,
      }
    })
  }, [conceptQuery.data, kotoba, categories])

  return { ...conceptQuery, data: rows }
}

export type LanguageCoverage = { code: string; covered: number }

/** How many concepts each language has a word for — the study signal. */
export function useCoverage(rows: ConceptRow[], codes: string[]) {
  return useMemo<LanguageCoverage[]>(
    () =>
      codes.map((code) => ({
        code,
        covered: rows.filter((r) => (r.wordsByLanguage.get(code)?.length ?? 0) > 0).length,
      })),
    [rows, codes],
  )
}
