import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWordList, useSentenceWordList } from '@/features/word/hooks'
import type { Word } from '@/features/word/api'
import { useLanguage } from '@/features/language/useLanguage'
import { useMeaningRows, type MeaningRow } from '@/features/meaning/hooks'
import { fetchSceneList, fetchSceneMeaningList, fetchSceneSentenceList, type Phrase, type Scene } from './api'

export function useSceneList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['scene', 'list', language],
    queryFn: () => fetchSceneList(current!),
    enabled: current != null,
  })
}

export function useSceneMeaningList() {
  return useQuery({
    queryKey: ['sceneMeaning', 'list'],
    queryFn: fetchSceneMeaningList,
  })
}

export function useSceneSentenceList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['sceneSentence', 'list', language],
    queryFn: () => fetchSceneSentenceList(current!),
    enabled: current != null,
  })
}

export function useSceneBySlug(slug: string | undefined) {
  const query = useSceneList()
  const scene = query.data?.find((row) => row.slug === slug)
  return { ...query, data: scene }
}

export function useSceneLookup() {
  const { data } = useSceneList()
  return useMemo(() => new Map((data ?? []).map((s) => [s.id, s])), [data])
}

/** Scene ids each meaning belongs to. */
export function useScenesByMeaning() {
  const { data } = useSceneMeaningList()
  return useMemo(() => {
    const map = new Map<number, number[]>()
    for (const link of data ?? []) {
      const list = map.get(link.meaning_id)
      if (list) list.push(link.scene_id)
      else map.set(link.meaning_id, [link.scene_id])
    }
    return map
  }, [data])
}

export type SceneCounts = {
  meanings: number
  /** Meanings with a word in the active language. */
  covered: number
  phrases: number
  sentences: number
}

/** Per scene id: its meanings, how many the active language covers, and its sentences. */
export function useSceneCounts() {
  const { language } = useLanguage()
  const { data: links } = useSceneMeaningList()
  const { data: meaningRows } = useMeaningRows()
  const { data: sentences } = useSceneSentenceList()

  return useMemo(() => {
    const counts = new Map<number, SceneCounts>()
    const entry = (id: number) => {
      const existing = counts.get(id)
      if (existing) return existing
      const fresh = { meanings: 0, covered: 0, phrases: 0, sentences: 0 }
      counts.set(id, fresh)
      return fresh
    }
    const coveredMeanings = new Set(
      meaningRows.filter((r) => (r.wordsByLanguage.get(language)?.length ?? 0) > 0).map((r) => r.meaning.id),
    )
    for (const link of links ?? []) {
      const e = entry(link.scene_id)
      e.meanings++
      if (coveredMeanings.has(link.meaning_id)) e.covered++
    }
    for (const s of sentences ?? []) {
      if (s.scene_id == null) continue
      if (s.word_id == null) entry(s.scene_id).phrases++
      else entry(s.scene_id).sentences++
    }
    return counts
  }, [links, meaningRows, sentences, language])
}

export function useChildScenes(sceneId: number | undefined) {
  const { data } = useSceneList()
  return useMemo<Scene[]>(
    () => (sceneId == null ? [] : (data ?? []).filter((s) => s.parent_id === sceneId)),
    [data, sceneId],
  )
}

export function useMeaningRowsForScene(sceneId: number | undefined) {
  const { data: links } = useSceneMeaningList()
  const query = useMeaningRows()
  const rows = useMemo<MeaningRow[]>(() => {
    if (sceneId == null) return []
    const ids = new Set((links ?? []).filter((l) => l.scene_id === sceneId).map((l) => l.meaning_id))
    return query.data.filter((r) => ids.has(r.meaning.id))
  }, [links, query.data, sceneId])
  return { ...query, data: rows }
}

export function useWordForScene(sceneId: number | undefined) {
  const query = useWordList()
  const words = useMemo<Word[]>(
    () => (sceneId == null ? [] : (query.data ?? []).filter((w) => w.scene_id === sceneId)),
    [query.data, sceneId],
  )
  return { ...query, data: words }
}

export type SentenceWithWords = Phrase & { words: Word[] }

/**
 * A scene's sentences, each with the words it uses (from sentence_word):
 * set phrases have no word of their own, example sentences do.
 */
export function useSentencesForScene(sceneId: number | undefined) {
  const sentenceQuery = useSceneSentenceList()
  const { data: words } = useWordList()
  const { data: links } = useSentenceWordList()

  const data = useMemo(() => {
    if (sceneId == null) return { phrases: [], sentences: [] }
    const wordById = new Map((words ?? []).map((w) => [w.id, w]))
    const wordsBySentence = new Map<number, Word[]>()
    for (const link of links ?? []) {
      const word = wordById.get(link.word_id)
      if (!word) continue
      const list = wordsBySentence.get(link.sentence_id)
      if (list) list.push(word)
      else wordsBySentence.set(link.sentence_id, [word])
    }
    const rows: SentenceWithWords[] = (sentenceQuery.data ?? [])
      .filter((s) => s.scene_id === sceneId)
      .map((s) => {
        const linked = wordsBySentence.get(s.id) ?? []
        const own = s.word_id != null ? wordById.get(s.word_id) : undefined
        return { ...s, words: own && !linked.includes(own) ? [own, ...linked] : linked }
      })
    return {
      phrases: rows.filter((s) => s.word_id == null),
      sentences: rows.filter((s) => s.word_id != null),
    }
  }, [sentenceQuery.data, words, links, sceneId])

  return { ...sentenceQuery, data }
}
