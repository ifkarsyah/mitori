import { useMemo } from 'react'
import { useCategoryList } from '@/features/category/hooks'
import { useSceneList } from '@/features/scene/hooks'
import {
  useWordList,
  useSentenceWordList,
  useSentencesList,
} from '@/features/word/hooks'

export type LinkedWord = {
  id: number
  word: string
  partOfSpeech: string | null
}

export type EnrichedSentence = {
  id: number
  sentence: string | null
  meaning: string | null
  wordId: number | null
  word: string | null
  wordReading: string | null
  partOfSpeech: string | null
  level: string | null
  kanaType: string | null
  categoryId: number | null
  category: string | null
  categorySlug: string | null
  scene: string | null
  sceneSlug: string | null
  linkedWords: LinkedWord[]
}

export function useSentencesWithWords() {
  const sentencesQuery = useSentencesList()
  const wordQuery = useWordList()
  const categoryQuery = useCategoryList()
  const sentenceWordQuery = useSentenceWordList()
  const sceneQuery = useSceneList()

  const data = useMemo<EnrichedSentence[]>(() => {
    if (!sentencesQuery.data) return []
    const wordById = new Map((wordQuery.data ?? []).map((k) => [k.id, k]))
    const categoryById = new Map((categoryQuery.data ?? []).map((c) => [c.id, c]))
    const sceneById = new Map((sceneQuery.data ?? []).map((c) => [c.id, c]))

    const linkedWordsBySentenceId = new Map<number, LinkedWord[]>()
    for (const link of sentenceWordQuery.data ?? []) {
      const word = wordById.get(link.word_id)
      if (!word) continue
      const list = linkedWordsBySentenceId.get(link.sentence_id)
      const entry = { id: word.id, word: word.word, partOfSpeech: word.part_of_speech }
      if (list) {
        list.push(entry)
      } else {
        linkedWordsBySentenceId.set(link.sentence_id, [entry])
      }
    }

    return sentencesQuery.data.map((s) => {
      const word = s.word_id != null ? wordById.get(s.word_id) : undefined
      const category = s.category_id != null ? categoryById.get(s.category_id) : undefined
      const scene = s.scene_id != null ? sceneById.get(s.scene_id) : undefined
      return {
        id: s.id,
        sentence: s.sentence,
        meaning: s.meaning,
        wordId: s.word_id,
        word: word?.word ?? null,
        wordReading: word?.reading ?? null,
        partOfSpeech: word?.part_of_speech ?? null,
        level: word?.level ?? null,
        kanaType: word?.kana_type ?? null,
        categoryId: s.category_id,
        category: category?.name ?? null,
        categorySlug: category?.slug ?? null,
        scene: scene?.name ?? null,
        sceneSlug: scene?.slug ?? null,
        linkedWords: linkedWordsBySentenceId.get(s.id) ?? [],
      }
    })
  }, [sentencesQuery.data, wordQuery.data, categoryQuery.data, sentenceWordQuery.data, sceneQuery.data])

  return {
    data,
    isLoading:
      sentencesQuery.isLoading ||
      wordQuery.isLoading ||
      categoryQuery.isLoading ||
      sceneQuery.isLoading ||
      sentenceWordQuery.isLoading,
    isError:
      sentencesQuery.isError ||
      wordQuery.isError ||
      categoryQuery.isError ||
      sceneQuery.isError ||
      sentenceWordQuery.isError,
    error:
      sentencesQuery.error ?? wordQuery.error ?? categoryQuery.error ?? sceneQuery.error ?? sentenceWordQuery.error,
    refetch: () => {
      sentencesQuery.refetch()
      wordQuery.refetch()
      categoryQuery.refetch()
      sceneQuery.refetch()
      sentenceWordQuery.refetch()
    },
  }
}
