import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { Language } from '@/features/language/languages'
import type { Tables } from '@/types/database'

const KOTOBA_COLUMNS =
  'id, word, reading, part_of_speech, sub_part_of_speech, meanings, kana_type, context_id, source_id, jlpt, created_at, updated_at, learned, language, concept_id, gender, plural, cefr'

export type Kotoba = Tables<'kotoba'>
export type WordKanji = Tables<'word_kanji'>
export type Sentence = Tables<'sentences'>
export type Context = Tables<'context'>
export type Source = Tables<'source'>
export type SentenceKotoba = Tables<'sentence_kotoba'>
export type Concept = Tables<'concept'>

export async function fetchKotobaList(language: Language): Promise<Kotoba[]> {
  return fetchAllRows<Kotoba>(async (from, to) =>
    supabase.from('kotoba').select(KOTOBA_COLUMNS).eq('language', language).order('id').range(from, to),
  )
}

/**
 * Every word regardless of language. Only for views that are inherently
 * cross-language (the concept bridge) or Japanese-structural (kanji links) —
 * everything else should use the language-scoped fetch.
 */
export async function fetchKotobaListAllLanguages(): Promise<Kotoba[]> {
  return fetchAllRows<Kotoba>(async (from, to) =>
    supabase.from('kotoba').select(KOTOBA_COLUMNS).order('id').range(from, to),
  )
}

export async function fetchConceptList(): Promise<Concept[]> {
  return fetchAllRows<Concept>(async (from, to) =>
    supabase
      .from('concept')
      .select('id, gloss, part_of_speech, created_at')
      .order('id')
      .range(from, to),
  )
}

export async function fetchWordKanjiList(): Promise<WordKanji[]> {
  return fetchAllRows<WordKanji>(async (from, to) =>
    supabase
      .from('word_kanji')
      .select('id, word_id, kanji_id, kanji_meaning_in_word, created_at, updated_at')
      .order('id')
      .range(from, to),
  )
}

export async function fetchSentencesList(language: Language): Promise<Sentence[]> {
  return fetchAllRows<Sentence>(async (from, to) =>
    supabase
      .from('sentences')
      .select('id, sentence, meaning, word_id, context_id, created_at, updated_at, language')
      .eq('language', language)
      .not('word_id', 'is', null)
      .order('id')
      .range(from, to),
  )
}

export async function fetchSentenceKotobaList(): Promise<SentenceKotoba[]> {
  return fetchAllRows<SentenceKotoba>(async (from, to) =>
    supabase
      .from('sentence_kotoba')
      .select('id, sentence_id, kotoba_id, created_at')
      .order('id')
      .range(from, to),
  )
}

export async function fetchContextList(): Promise<Context[]> {
  return fetchAllRows<Context>(async (from, to) =>
    supabase
      .from('context')
      .select('id, name, kind, Description, created_at')
      .order('id')
      .range(from, to),
  )
}

export async function fetchSourceList(): Promise<Source[]> {
  return fetchAllRows<Source>(async (from, to) =>
    supabase
      .from('source')
      .select('id, name, url, context_id, created_at')
      .order('id')
      .range(from, to),
  )
}
