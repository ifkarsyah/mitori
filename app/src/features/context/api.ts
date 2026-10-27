import { languageDb } from '@/lib/languageDb'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { LanguageRow } from '@/features/language/languages'
import type { Tables } from '@/types/database'

/**
 * A situation specific to one language (hanabi, konbini checkout), optionally
 * narrowing a general category from public.
 */
export type Context = Tables<{ schema: 'japanese' }, 'context'>
export type Phrase = Tables<{ schema: 'japanese' }, 'sentence'>

export async function fetchContextList(language: LanguageRow): Promise<Context[]> {
  const { data, error } = await languageDb(language)
    .from('context')
    .select('id, slug, name, description, category_id, sort_order, created_at')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

/** Sentences filed under a context: the set phrases of that situation. */
export async function fetchPhraseList(language: LanguageRow): Promise<Phrase[]> {
  return fetchAllRows<Phrase>(async (from, to) =>
    languageDb(language)
      .from('sentence')
      .select('id, sentence, meaning, word_id, category_id, context_id, created_at, updated_at')
      .not('context_id', 'is', null)
      .order('id')
      .range(from, to),
  )
}
