import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Category = Tables<'category'>

export async function fetchCategoryList(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('category')
    .select('id, slug, name, parent_id, kind, sort_order, created_at')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}
