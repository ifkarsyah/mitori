import { useMemo } from 'react'
import { useKanjiList } from '@/features/kanji/hooks'
import { useWordList, useSentenceWordList, useSentencesList, useWordKanjiList } from '@/features/word/hooks'
import { useLanguage } from '@/features/language/useLanguage'
import { kanjiCompleteness, wordCompleteness, sentenceCompleteness, structuralChecks } from './stats'

export function useQualityStats() {
  const { current } = useLanguage()
  // Japanese-only: see the note in NavBar about the shared character layer.
  const includeKanji = current?.script === 'japanese'
  const wordQuery = useWordList()
  const kanjiQuery = useKanjiList()
  const sentencesQuery = useSentencesList()
  const wordKanjiQuery = useWordKanjiList()
  const sentenceWordQuery = useSentenceWordList()

  const isLoading =
    wordQuery.isLoading || kanjiQuery.isLoading || sentencesQuery.isLoading || wordKanjiQuery.isLoading ||
    sentenceWordQuery.isLoading
  const isError =
    wordQuery.isError || kanjiQuery.isError || sentencesQuery.isError || wordKanjiQuery.isError ||
    sentenceWordQuery.isError
  const error =
    wordQuery.error ?? kanjiQuery.error ?? sentencesQuery.error ?? wordKanjiQuery.error ?? sentenceWordQuery.error

  const data = useMemo(() => {
    const words = wordQuery.data ?? []
    const kanji = kanjiQuery.data ?? []
    const sentences = sentencesQuery.data ?? []
    const wordKanji = wordKanjiQuery.data ?? []
    const sentenceWord = sentenceWordQuery.data ?? []
    const wordById = new Map(words.map((k) => [k.id, k]))

    // Kanji stats and the kanji-breakdown check are Japanese-structural, so
    // they are dropped entirely rather than shown as vacuously passing.
    const checks = structuralChecks({ words, sentences, wordKanji, sentenceWord, wordById })

    return {
      includeKanji,
      wordTotal: words.length,
      kanjiTotal: includeKanji ? kanji.length : 0,
      sentencesTotal: sentences.length,
      wordStats: wordCompleteness(words),
      kanjiStats: includeKanji ? kanjiCompleteness(kanji) : [],
      sentenceStats: sentenceCompleteness(sentences, wordById),
      checks: includeKanji ? checks : checks.filter((c) => c.key !== 'kanji_breakdown'),
    }
  }, [
    wordQuery.data,
    kanjiQuery.data,
    sentencesQuery.data,
    wordKanjiQuery.data,
    sentenceWordQuery.data,
    includeKanji,
  ])

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: () => {
      wordQuery.refetch()
      kanjiQuery.refetch()
      sentencesQuery.refetch()
      wordKanjiQuery.refetch()
      sentenceWordQuery.refetch()
    },
  }
}
