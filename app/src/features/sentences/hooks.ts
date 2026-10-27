import { useMemo } from 'react'
import { useCategoryList } from '@/features/category/hooks'
import {
  useKotobaList,
  useSentenceWordList,
  useSentencesList,
} from '@/features/kotoba/hooks'

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
  linkedWords: LinkedWord[]
}

export function useSentencesWithWords() {
  const sentencesQuery = useSentencesList()
  const kotobaQuery = useKotobaList()
  const categoryQuery = useCategoryList()
  const sentenceWordQuery = useSentenceWordList()

  const data = useMemo<EnrichedSentence[]>(() => {
    if (!sentencesQuery.data) return []
    const kotobaById = new Map((kotobaQuery.data ?? []).map((k) => [k.id, k]))
    const categoryById = new Map((categoryQuery.data ?? []).map((c) => [c.id, c]))

    const linkedWordsBySentenceId = new Map<number, LinkedWord[]>()
    for (const link of sentenceWordQuery.data ?? []) {
      const word = kotobaById.get(link.word_id)
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
      const word = s.word_id != null ? kotobaById.get(s.word_id) : undefined
      const category = s.category_id != null ? categoryById.get(s.category_id) : undefined
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
        linkedWords: linkedWordsBySentenceId.get(s.id) ?? [],
      }
    })
  }, [sentencesQuery.data, kotobaQuery.data, categoryQuery.data, sentenceWordQuery.data])

  return {
    data,
    isLoading:
      sentencesQuery.isLoading ||
      kotobaQuery.isLoading ||
      categoryQuery.isLoading ||
      sentenceWordQuery.isLoading,
    isError:
      sentencesQuery.isError || kotobaQuery.isError || categoryQuery.isError || sentenceWordQuery.isError,
    error: sentencesQuery.error ?? kotobaQuery.error ?? categoryQuery.error ?? sentenceWordQuery.error,
    refetch: () => {
      sentencesQuery.refetch()
      kotobaQuery.refetch()
      categoryQuery.refetch()
      sentenceWordQuery.refetch()
    },
  }
}
