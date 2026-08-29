import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { Language } from '@/features/language/languages'
import type { Tables } from '@/types/database'

export type GrammarPoint = Tables<'grammar_point'>

export async function fetchGrammarPointList(language: Language): Promise<GrammarPoint[]> {
  return fetchAllRows<GrammarPoint>(async (from, to) =>
    supabase
      .from('grammar_point')
      .select('id, slug, title, category, folder_order, sort_order, content, created_at, updated_at, language')
      .eq('language', language)
      .order('folder_order')
      .order('sort_order')
      .range(from, to),
  )
}
