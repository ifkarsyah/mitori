import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetchAllRows'
import type { Tables } from '@/types/database'

export type Resource = Tables<'resource'>
export type ResourceChannel = Tables<'resource_channel'>

export async function fetchResourceList(): Promise<Resource[]> {
  return fetchAllRows<Resource>(async (from, to) =>
    supabase
      .from('resource')
      .select('id, channel_id, title, url, category, context_id, created_at, updated_at')
      .order('id')
      .range(from, to),
  )
}

export async function fetchResourceChannelList(): Promise<ResourceChannel[]> {
  return fetchAllRows<ResourceChannel>(async (from, to) =>
    supabase
      .from('resource_channel')
      .select('id, platform, slug, name, url, description, created_at')
      .order('id')
      .range(from, to),
  )
}
