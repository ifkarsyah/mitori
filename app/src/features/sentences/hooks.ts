import { useMemo } from 'react'
import {
  useContextList,
  useKotobaList,
  useSentenceKotobaList,
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
  jlpt: string | null
  kanaType: string | null
  contextId: number | null
  context: string | null
  linkedWords: LinkedWord[]
}

export function useSentencesWithWords() {
  const sentencesQuery = useSentencesList()
  const kotobaQuery = useKotobaList()
  const contextQuery = useContextList()
  const sentenceKotobaQuery = useSentenceKotobaList()

  const data = useMemo<EnrichedSentence[]>(() => {
    if (!sentencesQuery.data) return []
    const kotobaById = new Map((kotobaQuery.data ?? []).map((k) => [k.id, k]))
    const contextById = new Map((contextQuery.data ?? []).map((c) => [c.id, c]))

    const linkedWordsBySentenceId = new Map<number, LinkedWord[]>()
    for (const link of sentenceKotobaQuery.data ?? []) {
      const word = kotobaById.get(link.kotoba_id)
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
      const context = s.context_id != null ? contextById.get(s.context_id) : undefined
      return {
        id: s.id,
        sentence: s.sentence,
        meaning: s.meaning,
        wordId: s.word_id,
        word: word?.word ?? null,
        wordReading: word?.reading ?? null,
        partOfSpeech: word?.part_of_speech ?? null,
        jlpt: word?.jlpt ?? null,
        kanaType: word?.kana_type ?? null,
        contextId: s.context_id,
        context: context?.name ?? null,
        linkedWords: linkedWordsBySentenceId.get(s.id) ?? [],
      }
    })
  }, [sentencesQuery.data, kotobaQuery.data, contextQuery.data, sentenceKotobaQuery.data])

  return {
    data,
    isLoading:
      sentencesQuery.isLoading ||
      kotobaQuery.isLoading ||
      contextQuery.isLoading ||
      sentenceKotobaQuery.isLoading,
    isError:
      sentencesQuery.isError || kotobaQuery.isError || contextQuery.isError || sentenceKotobaQuery.isError,
    error: sentencesQuery.error ?? kotobaQuery.error ?? contextQuery.error ?? sentenceKotobaQuery.error,
    refetch: () => {
      sentencesQuery.refetch()
      kotobaQuery.refetch()
      contextQuery.refetch()
      sentenceKotobaQuery.refetch()
    },
  }
}
