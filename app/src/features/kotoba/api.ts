import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { Tables } from '@/types/database'

export type Kotoba = Tables<'kotoba'>
export type WordKanji = Tables<'word_kanji'>
export type Sentence = Tables<'sentences'>
export type Context = Tables<'context'>
export type Source = Tables<'source'>
export type SentenceKotoba = Tables<'sentence_kotoba'>

export async function fetchKotobaList(): Promise<Kotoba[]> {
  return fetchAllRows<Kotoba>(async (from, to) =>
    supabase
      .from('kotoba')
      .select(
        'id, word, reading, part_of_speech, sub_part_of_speech, meanings, kana_type, context_id, source_id, jlpt, created_at, updated_at',
      )
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

export async function fetchSentencesList(): Promise<Sentence[]> {
  return fetchAllRows<Sentence>(async (from, to) =>
    supabase
      .from('sentences')
      .select('id, sentence, meaning, word_id, context_id, created_at, updated_at')
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
