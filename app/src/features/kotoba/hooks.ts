import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchConceptList,
  fetchKotobaList,
  fetchKotobaListAllLanguages,
  fetchSentenceWordList,
  fetchSentencesList,
  fetchSourceList,
  fetchWordKanjiList,
} from './api'
import { useKanjiList } from '@/features/kanji/hooks'
import { useLanguage } from '@/features/language/useLanguage'

/** Words in the language the app is currently scoped to. */
export function useKotobaList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['kotoba', 'list', language],
    queryFn: () => fetchKotobaList(current!),
    enabled: current != null,
  })
}

/** Words in every language — for the concept bridge only. */
export function useKotobaListAllLanguages() {
  const { languages } = useLanguage()
  return useQuery({
    queryKey: ['kotoba', 'list', 'all', languages.map((l) => l.code)],
    queryFn: () => fetchKotobaListAllLanguages(languages),
    enabled: languages.length > 0,
  })
}

/** Japanese words, for kanji links — word_kanji only exists in the japanese schema. */
export function useJapaneseKotobaList() {
  const { languages } = useLanguage()
  const japanese = languages.find((l) => l.schema_name === 'japanese')
  return useQuery({
    queryKey: ['kotoba', 'list', japanese?.code],
    queryFn: () => fetchKotobaList(japanese!),
    enabled: japanese != null,
  })
}

export function useWordKanjiList() {
  return useQuery({
    queryKey: ['wordKanji', 'list'],
    queryFn: fetchWordKanjiList,
  })
}

export function useSentencesList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['sentences', 'list', language],
    queryFn: () => fetchSentencesList(current!),
    enabled: current != null,
  })
}

export function useSentenceWordList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['sentenceWord', 'list', language],
    queryFn: () => fetchSentenceWordList(current!),
    enabled: current != null,
  })
}

export function useSourceList() {
  const { language, current } = useLanguage()
  return useQuery({
    queryKey: ['source', 'list', language],
    queryFn: () => fetchSourceList(current!),
    enabled: current != null,
  })
}

export function useConceptList() {
  return useQuery({
    queryKey: ['concept', 'list'],
    queryFn: fetchConceptList,
  })
}

export function useConceptById(id: number | null | undefined) {
  const query = useConceptList()
  const concept = id == null ? undefined : query.data?.find((row) => row.id === id)
  return { ...query, data: concept }
}

/**
 * Every word realizing a concept, in every language — including Japanese synonyms
 * that share one concept (持ち帰り / お持ち帰り / テイクアウト).
 */
export function useKotobaForConcept(conceptId: number | null | undefined) {
  // Cross-language on purpose — showing the other language's word for this
  // concept is the entire point of the concept link.
  const query = useKotobaListAllLanguages()
  const words =
    conceptId == null ? [] : (query.data?.filter((row) => row.concept_id === conceptId) ?? [])
  return { ...query, data: words }
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
