import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchResourceChannelList, fetchResourceList } from './api'

export function useResourceList() {
  return useQuery({
    queryKey: ['resource', 'list'],
    queryFn: fetchResourceList,
  })
}

export function useResourceChannelList() {
  return useQuery({
    queryKey: ['resourceChannel', 'list'],
    queryFn: fetchResourceChannelList,
  })
}

export function useResourceById(id: number | undefined) {
  const query = useResourceList()
  const resource = query.data?.find((row) => row.id === id)
  return { ...query, data: resource }
}

export function useResourceChannelById(id: number | undefined) {
  const query = useResourceChannelList()
  const channel = query.data?.find((row) => row.id === id)
  return { ...query, data: channel }
}

export function useResourceChannelBySlug(slug: string | undefined) {
  const query = useResourceChannelList()
  const channel = query.data?.find((row) => row.slug === slug)
  return { ...query, data: channel }
}

export function useResourcesForChannel(channelId: number | undefined) {
  const query = useResourceList()
  const resources = query.data?.filter((row) => row.channel_id === channelId) ?? []
  return { ...query, data: resources }
}

export function useChannelResourceCounts() {
  const { data } = useResourceList()
  return useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of data ?? []) {
      if (row.channel_id == null) continue
      counts.set(row.channel_id, (counts.get(row.channel_id) ?? 0) + 1)
    }
    return counts
  }, [data])
}
