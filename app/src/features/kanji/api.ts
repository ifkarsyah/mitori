import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { Tables } from '@/types/database'

export type Kanji = Tables<{ schema: 'japanese' }, 'kanji'>

export async function fetchKanjiList(): Promise<Kanji[]> {
  return fetchAllRows<Kanji>(async (from, to) =>
    supabase
      .schema('japanese')
      .from('kanji')
      .select(
        'id, character, jlpt, grade, kanjimap_url, kanjigraph_url, meanings, cluster, created_at, updated_at, learned',
      )
      .order('id')
      .range(from, to),
  )
}
