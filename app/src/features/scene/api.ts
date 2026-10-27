import { languageDb } from '@/lib/languageDb'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { LanguageRow } from '@/features/language/languages'
import type { Tables } from '@/types/database'

/**
 * A situation specific to one language (hanabi, konbini checkout), optionally
 * narrowing a general category from public.
 */
export type Scene = Tables<{ schema: 'japanese' }, 'scene'>
export type Phrase = Tables<{ schema: 'japanese' }, 'sentence'>

export async function fetchSceneList(language: LanguageRow): Promise<Scene[]> {
  const { data, error } = await languageDb(language)
    .from('scene')
    .select('id, slug, name, description, category_id, sort_order, created_at')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

/** Sentences filed under a scene: the set phrases of that situation. */
export async function fetchPhraseList(language: LanguageRow): Promise<Phrase[]> {
  return fetchAllRows<Phrase>(async (from, to) =>
    languageDb(language)
      .from('sentence')
      .select('id, sentence, meaning, word_id, category_id, scene_id, created_at, updated_at')
      .not('scene_id', 'is', null)
      .order('id')
      .range(from, to),
  )
}
