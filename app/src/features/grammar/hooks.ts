import { useQuery } from '@tanstack/react-query'
import { fetchGrammarPointList } from './api'
import { useLanguage } from '@/features/language/useLanguage'

export function useGrammarPointList() {
  const { language } = useLanguage()
  return useQuery({
    queryKey: ['grammarPoint', 'list', language],
    queryFn: () => fetchGrammarPointList(language),
  })
}

export function useGrammarPointBySlug(slug: string | undefined) {
  const query = useGrammarPointList()
  const point = query.data?.find((row) => row.slug === slug)
  return { ...query, data: point }
}
