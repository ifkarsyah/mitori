import { useMemo } from 'react'
import { useMeaningList, useWordListAllLanguages } from '@/features/word/hooks'
import { useCategoryLookup } from '@/features/category/hooks'
import type { Category } from '@/features/category/api'
import type { Meaning, Word } from '@/features/word/api'

export { useMeaningList, useMeaningById, useWordForMeaning } from '@/features/word/hooks'

/** A meaning with its category and the words realizing it, keyed by language. */
export type MeaningRow = {
  meaning: Meaning
  category: Category | undefined
  topCategory: Category | undefined
  wordsByLanguage: Map<string, Word[]>
}

export function useMeaningRows() {
  const meaningQuery = useMeaningList()
  // Deliberately unscoped: the meaning view exists to compare languages
  // side by side, so filtering it to the active language would defeat it.
  const { data: words } = useWordListAllLanguages()
  const categories = useCategoryLookup()

  const rows = useMemo<MeaningRow[]>(() => {
    if (!meaningQuery.data) return []

    const wordsByMeaning = new Map<number, Word[]>()
    for (const word of words ?? []) {
      if (word.meaning_id == null) continue
      const bucket = wordsByMeaning.get(word.meaning_id)
      if (bucket) bucket.push(word)
      else wordsByMeaning.set(word.meaning_id, [word])
    }

    return meaningQuery.data.map((meaning) => {
      const byLanguage = new Map<string, Word[]>()
      for (const word of wordsByMeaning.get(meaning.id) ?? []) {
        const bucket = byLanguage.get(word.language)
        if (bucket) bucket.push(word)
        else byLanguage.set(word.language, [word])
      }
      return {
        meaning,
        category: meaning.category_id != null ? categories.byId.get(meaning.category_id) : undefined,
        topCategory: categories.topLevelOf(meaning.category_id),
        wordsByLanguage: byLanguage,
      }
    })
  }, [meaningQuery.data, words, categories])

  return { ...meaningQuery, data: rows }
}

export type LanguageCoverage = { code: string; covered: number }

/** How many meanings each language has a word for — the study signal. */
export function useCoverage(rows: MeaningRow[], codes: string[]) {
  return useMemo<LanguageCoverage[]>(
    () =>
      codes.map((code) => ({
        code,
        covered: rows.filter((r) => (r.wordsByLanguage.get(code)?.length ?? 0) > 0).length,
      })),
    [rows, codes],
  )
}

export type MeaningCategory = { category: Category | undefined; top: Category | undefined }

/**
 * Category per meaning id. Words no longer carry a context of their own, so the
 * word views read the category off the meaning the word realizes.
 */
export function useMeaningCategories() {
  const { data: meanings } = useMeaningList()
  const categories = useCategoryLookup()

  return useMemo(() => {
    const map = new Map<number, MeaningCategory>()
    for (const meaning of meanings ?? []) {
      map.set(meaning.id, {
        category: meaning.category_id != null ? categories.byId.get(meaning.category_id) : undefined,
        top: categories.topLevelOf(meaning.category_id),
      })
    }
    return map
  }, [meanings, categories])
}
