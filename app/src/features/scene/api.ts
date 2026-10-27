import { supabase } from '@/lib/supabase'
import { languageDb } from '@/lib/languageDb'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { LanguageRow } from '@/features/language/languages'
import type { Tables } from '@/types/database'

/**
 * A real-world place (restaurant, hospital, online). General scenes have no
 * language; a language-specific one (konbini checkout, hanabi) carries its
 * language code and usually narrows a general scene through parent_id.
 */
export type Scene = Tables<'scene'>
export type SceneMeaning = Tables<'scene_meaning'>
export type Phrase = Tables<{ schema: 'japanese' }, 'sentence'>

/** General scenes plus the ones only the given language has. */
export async function fetchSceneList(language: LanguageRow): Promise<Scene[]> {
  const { data, error } = await supabase
    .from('scene')
    .select('id, slug, name, description, parent_id, language, sort_order, created_at')
    .or(`language.is.null,language.eq.${language.code}`)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchSceneMeaningList(): Promise<SceneMeaning[]> {
  return fetchAllRows<SceneMeaning>(async (from, to) =>
    supabase
      .from('scene_meaning')
      .select('scene_id, meaning_id, created_at')
      .order('scene_id')
      .order('meaning_id')
      .range(from, to),
  )
}

/** Sentences set in a scene: set phrases (no word) and example sentences. */
export async function fetchSceneSentenceList(language: LanguageRow): Promise<Phrase[]> {
  return fetchAllRows<Phrase>(async (from, to) =>
    languageDb(language)
      .from('sentence')
      .select('id, sentence, meaning, word_id, category_id, scene_id, created_at, updated_at')
      .not('scene_id', 'is', null)
      .order('id')
      .range(from, to),
  )
}
