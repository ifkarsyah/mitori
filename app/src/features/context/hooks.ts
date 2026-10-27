import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useKotobaList, useSentenceWordList } from '@/features/kotoba/hooks'
import type { Kotoba } from '@/features/kotoba/api'
import { useLanguage } from '@/features/language/useLanguage'
import { fetchContextList, fetchPhraseList, type Phrase } from './api'

export function useContextList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['context', 'list', language],
    queryFn: () => fetchContextList(current!),
    enabled: current != null,
  })
}

export function usePhraseList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['phrase', 'list', language],
    queryFn: () => fetchPhraseList(current!),
    enabled: current != null,
  })
}

export function useContextBySlug(slug: string | undefined) {
  const query = useContextList()
  const context = query.data?.find((row) => row.slug === slug)
  return { ...query, data: context }
}

/** Word and phrase counts per context id. */
export function useContextCounts() {
  const { data: words } = useKotobaList()
  const { data: phrases } = usePhraseList()
  return useMemo(() => {
    const counts = new Map<number, { words: number; phrases: number }>()
    const entry = (id: number) => {
      const existing = counts.get(id)
      if (existing) return existing
      const fresh = { words: 0, phrases: 0 }
      counts.set(id, fresh)
      return fresh
    }
    for (const w of words ?? []) if (w.context_id != null) entry(w.context_id).words++
    for (const p of phrases ?? []) if (p.context_id != null) entry(p.context_id).phrases++
    return counts
  }, [words, phrases])
}

export function useKotobaForContext(contextId: number | undefined) {
  const query = useKotobaList()
  const words = useMemo<Kotoba[]>(
    () => (contextId == null ? [] : (query.data ?? []).filter((w) => w.context_id === contextId)),
    [query.data, contextId],
  )
  return { ...query, data: words }
}

export type PhraseWithWords = Phrase & { words: Kotoba[] }

/** A context's phrases, each with the words it uses (from sentence_word). */
export function usePhrasesForContext(contextId: number | undefined) {
  const phraseQuery = usePhraseList()
  const { data: words } = useKotobaList()
  const { data: links } = useSentenceWordList()

  const data = useMemo<PhraseWithWords[]>(() => {
    if (contextId == null) return []
    const wordById = new Map((words ?? []).map((w) => [w.id, w]))
    const wordsBySentence = new Map<number, Kotoba[]>()
    for (const link of links ?? []) {
      const word = wordById.get(link.word_id)
      if (!word) continue
      const list = wordsBySentence.get(link.sentence_id)
      if (list) list.push(word)
      else wordsBySentence.set(link.sentence_id, [word])
    }
    return (phraseQuery.data ?? [])
      .filter((p) => p.context_id === contextId)
      .map((p) => ({ ...p, words: wordsBySentence.get(p.id) ?? [] }))
  }, [phraseQuery.data, words, links, contextId])

  return { ...phraseQuery, data }
}
