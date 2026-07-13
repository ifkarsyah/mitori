import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchContextList,
  fetchKotobaList,
  fetchSentenceKotobaList,
  fetchSentencesList,
  fetchSourceList,
  fetchWordKanjiList,
} from './api'
import { useKanjiList } from '@/features/kanji/hooks'

export function useKotobaList() {
  return useQuery({
    queryKey: ['kotoba', 'list'],
    queryFn: fetchKotobaList,
  })
}

export function useWordKanjiList() {
  return useQuery({
    queryKey: ['wordKanji', 'list'],
    queryFn: fetchWordKanjiList,
  })
}

export function useSentencesList() {
  return useQuery({
    queryKey: ['sentences', 'list'],
    queryFn: fetchSentencesList,
  })
}

export function useSentenceKotobaList() {
  return useQuery({
    queryKey: ['sentenceKotoba', 'list'],
    queryFn: fetchSentenceKotobaList,
  })
}

export function useContextList() {
  return useQuery({
    queryKey: ['context', 'list'],
    queryFn: fetchContextList,
  })
}

export function useSourceList() {
  return useQuery({
    queryKey: ['source', 'list'],
    queryFn: fetchSourceList,
  })
}

export function useKotobaById(id: number | undefined) {
  const query = useKotobaList()
  const kotoba = query.data?.find((row) => row.id === id)
  return { ...query, data: kotoba }
}

export function useKotobaByWord(word: string | undefined) {
  const query = useKotobaList()
  const kotoba = query.data?.find((row) => row.word === word)
  return { ...query, data: kotoba }
}

export function useSentencesForWord(wordId: number | undefined) {
  const query = useSentencesList()
  const sentences = query.data?.filter((row) => row.word_id === wordId) ?? []
  return { ...query, data: sentences }
}

export type KanjiInWord = {
  kanjiId: number
  character: string | null
  kanjiMeaningInWord: string | null
}

export function useKanjiForWord(wordId: number | undefined) {
  const { data: wordKanji, isLoading: wkLoading, isError: wkError } = useWordKanjiList()
  const { data: kanji, isLoading: kanjiLoading, isError: kanjiError } = useKanjiList()

  const composingKanji = useMemo<KanjiInWord[]>(() => {
    if (!wordKanji || !kanji || wordId == null) return []
    const kanjiById = new Map(kanji.map((k) => [k.id, k]))
    return wordKanji
      .filter((link) => link.word_id === wordId && link.kanji_id != null)
      .map((link) => {
        const k = kanjiById.get(link.kanji_id!)
        return k
          ? { kanjiId: k.id, character: k.character, kanjiMeaningInWord: link.kanji_meaning_in_word }
          : null
      })
      .filter((k): k is KanjiInWord => k !== null)
  }, [wordKanji, kanji, wordId])

  return {
    data: composingKanji,
    isLoading: wkLoading || kanjiLoading,
    isError: wkError || kanjiError,
  }
}
