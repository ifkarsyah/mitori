import { useQuery } from '@tanstack/react-query'
import { fetchGrammarPointList } from './api'

export function useGrammarPointList() {
  return useQuery({
    queryKey: ['grammarPoint', 'list'],
    queryFn: fetchGrammarPointList,
  })
}

export function useGrammarPointBySlug(slug: string | undefined) {
  const query = useGrammarPointList()
  const point = query.data?.find((row) => row.slug === slug)
  return { ...query, data: point }
}
