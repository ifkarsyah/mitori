import { languageDb } from '@/lib/languageDb'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { LanguageRow } from '@/features/language/languages'
import type { Tables } from '@/types/database'

export type GrammarPoint = Tables<{ schema: 'japanese' }, 'grammar_point'>

export async function fetchGrammarPointList(language: LanguageRow): Promise<GrammarPoint[]> {
  return fetchAllRows<GrammarPoint>(async (from, to) =>
    languageDb(language)
      .from('grammar_point')
      .select('id, slug, title, category, folder_order, sort_order, content, created_at, updated_at')
      .order('folder_order')
      .order('sort_order')
      .range(from, to),
  )
}
