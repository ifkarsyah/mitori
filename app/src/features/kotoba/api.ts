import { supabase } from '@/lib/supabase'
import { languageDb } from '@/lib/languageDb'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { LanguageRow } from '@/features/language/languages'
import type { Tables } from '@/types/database'

type JapaneseWord = Tables<{ schema: 'japanese' }, 'word'>
type GermanWord = Tables<{ schema: 'german' }, 'word'>

/**
 * One word in any language. Each schema's word table carries only its own
 * columns; fetchKotobaList fills the rest with null and tags the row with its
 * language, so shared screens can read reading or gender without caring which
 * schema the row came from. Ids are only unique within one language.
 */
export type Kotoba = Omit<JapaneseWord, 'kana_type'> &
  Pick<GermanWord, 'gender' | 'plural'> & {
    kana_type: string | null
    language: string
  }
export type WordKanji = Tables<{ schema: 'japanese' }, 'word_kanji'>
export type Sentence = Tables<{ schema: 'japanese' }, 'sentence'>
export type Source = Tables<{ schema: 'japanese' }, 'source'>
export type SentenceWord = Tables<{ schema: 'japanese' }, 'sentence_word'>
export type Concept = Tables<'concept'>

const LANGUAGE_SPECIFIC_COLUMNS = {
  reading: null,
  kana_type: null,
  sub_part_of_speech: null,
  gender: null,
  plural: null,
}

export async function fetchKotobaList(language: LanguageRow): Promise<Kotoba[]> {
  const rows = await fetchAllRows<Partial<Kotoba>>(async (from, to) =>
    languageDb(language).from('word').select('*').order('id').range(from, to),
  )
  return rows.map((row) => ({ ...LANGUAGE_SPECIFIC_COLUMNS, ...row, language: language.code }) as Kotoba)
}

/**
 * Every word regardless of language. Only for views that are inherently
 * cross-language (the concept bridge) — everything else should use the
 * language-scoped fetch.
 */
export async function fetchKotobaListAllLanguages(languages: LanguageRow[]): Promise<Kotoba[]> {
  const lists = await Promise.all(languages.map(fetchKotobaList))
  return lists.flat()
}

export async function fetchConceptList(): Promise<Concept[]> {
  return fetchAllRows<Concept>(async (from, to) =>
    supabase
      .from('concept')
      .select('id, gloss, part_of_speech, created_at, slug, category_id, tier')
      .order('id')
      .range(from, to),
  )
}

export async function fetchWordKanjiList(): Promise<WordKanji[]> {
  return fetchAllRows<WordKanji>(async (from, to) =>
    supabase
      .schema('japanese')
      .from('word_kanji')
      .select('id, word_id, kanji_id, kanji_meaning_in_word, created_at, updated_at')
      .order('id')
      .range(from, to),
  )
}

export async function fetchSentencesList(language: LanguageRow): Promise<Sentence[]> {
  return fetchAllRows<Sentence>(async (from, to) =>
    languageDb(language)
      .from('sentence')
      .select('id, sentence, meaning, word_id, category_id, context_id, created_at, updated_at')
      .not('word_id', 'is', null)
      .order('id')
      .range(from, to),
  )
}

export async function fetchSentenceWordList(language: LanguageRow): Promise<SentenceWord[]> {
  return fetchAllRows<SentenceWord>(async (from, to) =>
    languageDb(language)
      .from('sentence_word')
      .select('id, sentence_id, word_id, created_at')
      .order('id')
      .range(from, to),
  )
}

export async function fetchSourceList(language: LanguageRow): Promise<Source[]> {
  return fetchAllRows<Source>(async (from, to) =>
    languageDb(language)
      .from('source')
      .select('id, name, url, category_id, created_at')
      .order('id')
      .range(from, to),
  )
}
