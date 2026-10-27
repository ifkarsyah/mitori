import { languageDb } from '@/lib/languageDb'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { LanguageRow } from '@/features/language/languages'
import type { Tables } from '@/types/database'

export type Resource = Tables<{ schema: 'japanese' }, 'resource'>
export type ResourceChannel = Tables<{ schema: 'japanese' }, 'resource_channel'>

export async function fetchResourceList(language: LanguageRow): Promise<Resource[]> {
  return fetchAllRows<Resource>(async (from, to) =>
    languageDb(language)
      .from('resource')
      .select(
        'id, channel_id, title, url, category, category_id, created_at, updated_at, transcript, is_transcript_complete',
      )
      .order('id')
      .range(from, to),
  )
}

export async function fetchResourceChannelList(language: LanguageRow): Promise<ResourceChannel[]> {
  return fetchAllRows<ResourceChannel>(async (from, to) =>
    languageDb(language)
      .from('resource_channel')
      .select('id, platform, slug, name, url, description, created_at')
      .order('id')
      .range(from, to),
  )
}
