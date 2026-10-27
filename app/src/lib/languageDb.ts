import { supabase } from '@/lib/supabase'
import type { LanguageRow } from '@/features/language/languages'

/**
 * The client for one language's schema (japanese, german, chinese). public
 * only holds what every language shares — language, category, meaning.
 *
 * Every language schema has the same core tables (word, sentence,
 * sentence_word, source, grammar_point, resource_channel, resource) with the
 * same columns, so shared screens query whichever schema is active. It is typed
 * as the Japanese schema because TypeScript can't call .from() on a union of
 * schema clients; only `word` differs between schemas, and fetchWordList
 * normalizes that.
 */
export function languageDb(language: LanguageRow) {
  return supabase.schema(language.schema_name as 'japanese')
}
