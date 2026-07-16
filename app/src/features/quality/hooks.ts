import { useMemo } from 'react'
import { useKanjiList } from '@/features/kanji/hooks'
import { useKotobaList, useSentenceKotobaList, useSentencesList, useWordKanjiList } from '@/features/kotoba/hooks'
import { kanjiCompleteness, kotobaCompleteness, sentenceCompleteness, structuralChecks } from './stats'

export function useQualityStats() {
  const kotobaQuery = useKotobaList()
  const kanjiQuery = useKanjiList()
  const sentencesQuery = useSentencesList()
  const wordKanjiQuery = useWordKanjiList()
  const sentenceKotobaQuery = useSentenceKotobaList()

  const isLoading =
    kotobaQuery.isLoading || kanjiQuery.isLoading || sentencesQuery.isLoading || wordKanjiQuery.isLoading ||
    sentenceKotobaQuery.isLoading
  const isError =
    kotobaQuery.isError || kanjiQuery.isError || sentencesQuery.isError || wordKanjiQuery.isError ||
    sentenceKotobaQuery.isError
  const error =
    kotobaQuery.error ?? kanjiQuery.error ?? sentencesQuery.error ?? wordKanjiQuery.error ?? sentenceKotobaQuery.error

  const data = useMemo(() => {
    const kotoba = kotobaQuery.data ?? []
    const kanji = kanjiQuery.data ?? []
    const sentences = sentencesQuery.data ?? []
    const wordKanji = wordKanjiQuery.data ?? []
    const sentenceKotoba = sentenceKotobaQuery.data ?? []
    const kotobaById = new Map(kotoba.map((k) => [k.id, k]))

    return {
      kotobaTotal: kotoba.length,
      kanjiTotal: kanji.length,
      sentencesTotal: sentences.length,
      kotobaStats: kotobaCompleteness(kotoba),
      kanjiStats: kanjiCompleteness(kanji),
      sentenceStats: sentenceCompleteness(sentences, kotobaById),
      checks: structuralChecks({ kotoba, sentences, wordKanji, sentenceKotoba, kotobaById }),
    }
  }, [kotobaQuery.data, kanjiQuery.data, sentencesQuery.data, wordKanjiQuery.data, sentenceKotobaQuery.data])

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: () => {
      kotobaQuery.refetch()
      kanjiQuery.refetch()
      sentencesQuery.refetch()
      wordKanjiQuery.refetch()
      sentenceKotobaQuery.refetch()
    },
  }
}
