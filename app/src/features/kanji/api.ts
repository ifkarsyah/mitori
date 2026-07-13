import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { Tables } from '@/types/database'

export type Kanji = Tables<'kanji'>

export async function fetchKanjiList(): Promise<Kanji[]> {
  return fetchAllRows<Kanji>(async (from, to) =>
    supabase
      .from('kanji')
      .select(
        'id, character, jlpt, grade, kanjimap_url, kanjigraph_url, meanings, cluster, created_at, updated_at',
      )
      .order('id')
      .range(from, to),
  )
}
