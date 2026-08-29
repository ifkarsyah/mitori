import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { Language } from '@/features/language/languages'
import type { Tables } from '@/types/database'

export type Resource = Tables<'resource'>
export type ResourceChannel = Tables<'resource_channel'>

export async function fetchResourceList(language: Language): Promise<Resource[]> {
  return fetchAllRows<Resource>(async (from, to) =>
    supabase
      .from('resource')
      .select(
        'id, channel_id, title, url, category, category_id, created_at, updated_at, transcript, is_transcript_complete, language',
      )
      .eq('language', language)
      .order('id')
      .range(from, to),
  )
}

export async function fetchResourceChannelList(language: Language): Promise<ResourceChannel[]> {
  return fetchAllRows<ResourceChannel>(async (from, to) =>
    supabase
      .from('resource_channel')
      .select('id, platform, slug, name, url, description, created_at, language')
      .eq('language', language)
      .order('id')
      .range(from, to),
  )
}
