import { useMemo } from 'react'
import { useKanjiList } from '@/features/kanji/hooks'
import { useKotobaList, useSentenceKotobaList, useSentencesList, useWordKanjiList } from '@/features/kotoba/hooks'
import { useLanguage } from '@/features/language/useLanguage'
import { kanjiCompleteness, kotobaCompleteness, sentenceCompleteness, structuralChecks } from './stats'

export function useQualityStats() {
  const { current } = useLanguage()
  // Japanese-only: see the note in NavBar about the shared character layer.
  const includeKanji = current?.script === 'japanese'
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

    // Kanji stats and the kanji-breakdown check are Japanese-structural, so
    // they are dropped entirely rather than shown as vacuously passing.
    const checks = structuralChecks({ kotoba, sentences, wordKanji, sentenceKotoba, kotobaById })

    return {
      includeKanji,
      kotobaTotal: kotoba.length,
      kanjiTotal: includeKanji ? kanji.length : 0,
      sentencesTotal: sentences.length,
      kotobaStats: kotobaCompleteness(kotoba),
      kanjiStats: includeKanji ? kanjiCompleteness(kanji) : [],
      sentenceStats: sentenceCompleteness(sentences, kotobaById),
      checks: includeKanji ? checks : checks.filter((c) => c.key !== 'kanji_breakdown'),
    }
  }, [
    kotobaQuery.data,
    kanjiQuery.data,
    sentencesQuery.data,
    wordKanjiQuery.data,
    sentenceKotobaQuery.data,
    includeKanji,
  ])

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
