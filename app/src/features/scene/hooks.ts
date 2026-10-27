import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWordList, useSentenceWordList } from '@/features/word/hooks'
import type { Word } from '@/features/word/api'
import { useLanguage } from '@/features/language/useLanguage'
import { fetchSceneList, fetchPhraseList, type Phrase } from './api'

export function useSceneList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['scene', 'list', language],
    queryFn: () => fetchSceneList(current!),
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

export function useSceneBySlug(slug: string | undefined) {
  const query = useSceneList()
  const scene = query.data?.find((row) => row.slug === slug)
  return { ...query, data: scene }
}

/** Word and phrase counts per scene id. */
export function useSceneCounts() {
  const { data: words } = useWordList()
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
    for (const w of words ?? []) if (w.scene_id != null) entry(w.scene_id).words++
    for (const p of phrases ?? []) if (p.scene_id != null) entry(p.scene_id).phrases++
    return counts
  }, [words, phrases])
}

export function useWordForScene(sceneId: number | undefined) {
  const query = useWordList()
  const words = useMemo<Word[]>(
    () => (sceneId == null ? [] : (query.data ?? []).filter((w) => w.scene_id === sceneId)),
    [query.data, sceneId],
  )
  return { ...query, data: words }
}

export type PhraseWithWords = Phrase & { words: Word[] }

/** A scene's phrases, each with the words it uses (from sentence_word). */
export function usePhrasesForScene(sceneId: number | undefined) {
  const phraseQuery = usePhraseList()
  const { data: words } = useWordList()
  const { data: links } = useSentenceWordList()

  const data = useMemo<PhraseWithWords[]>(() => {
    if (sceneId == null) return []
    const wordById = new Map((words ?? []).map((w) => [w.id, w]))
    const wordsBySentence = new Map<number, Word[]>()
    for (const link of links ?? []) {
      const word = wordById.get(link.word_id)
      if (!word) continue
      const list = wordsBySentence.get(link.sentence_id)
      if (list) list.push(word)
      else wordsBySentence.set(link.sentence_id, [word])
    }
    return (phraseQuery.data ?? [])
      .filter((p) => p.scene_id === sceneId)
      .map((p) => ({ ...p, words: wordsBySentence.get(p.id) ?? [] }))
  }, [phraseQuery.data, words, links, sceneId])

  return { ...phraseQuery, data }
}
