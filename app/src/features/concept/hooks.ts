import { useMemo } from 'react'
import { useConceptList, useKotobaListAllLanguages } from '@/features/kotoba/hooks'
import type { Concept, Kotoba } from '@/features/kotoba/api'

export { useConceptList, useConceptById, useKotobaForConcept } from '@/features/kotoba/hooks'

/** A concept together with every word realizing it, split by language. */
export type ConceptRow = {
  concept: Concept
  ja: Kotoba[]
  de: Kotoba[]
}

export function useConceptRows() {
  const conceptQuery = useConceptList()
  // Deliberately unscoped: the concept view exists to compare languages
  // side by side, so filtering it to the active language would defeat it.
  const { data: kotoba } = useKotobaListAllLanguages()

  const rows = useMemo<ConceptRow[]>(() => {
    if (!conceptQuery.data) return []
    const byConceptId = new Map<number, Kotoba[]>()
    for (const row of kotoba ?? []) {
      if (row.concept_id == null) continue
      const bucket = byConceptId.get(row.concept_id)
      if (bucket) bucket.push(row)
      else byConceptId.set(row.concept_id, [row])
    }
    return conceptQuery.data.map((concept) => {
      const words = byConceptId.get(concept.id) ?? []
      return {
        concept,
        ja: words.filter((w) => w.language === 'ja'),
        de: words.filter((w) => w.language === 'de'),
      }
    })
  }, [conceptQuery.data, kotoba])

  return { ...conceptQuery, data: rows }
}
