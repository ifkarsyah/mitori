import { supabase } from '@/lib/supabase'
import type { LanguageRow } from './languages'

export async function fetchLanguageList(): Promise<LanguageRow[]> {
  const { data, error } = await supabase
    .from('language')
    .select('code, name, script, direction, level_system, has_reading, has_gender, has_characters, sort_order, created_at')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}
