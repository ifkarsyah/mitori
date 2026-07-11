import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchKanjiList } from './api'
import { useKotobaList, useWordKanjiList } from '@/features/kotoba/hooks'

export function useKanjiList() {
  return useQuery({
    queryKey: ['kanji', 'list'],
    queryFn: fetchKanjiList,
  })
}

export function useKanjiById(id: number | undefined) {
  const query = useKanjiList()
  const kanji = query.data?.find((row) => row.id === id)
  return { ...query, data: kanji }
}

export function useKanjiUsageCounts() {
  const { data: wordKanji } = useWordKanjiList()
  return useMemo(() => {
    const counts = new Map<number, number>()
    for (const link of wordKanji ?? []) {
      if (link.kanji_id == null) continue
      counts.set(link.kanji_id, (counts.get(link.kanji_id) ?? 0) + 1)
    }
    return counts
  }, [wordKanji])
}

export type WordUsingKanji = {
  wordId: number
  word: string
  reading: string | null
  kanjiMeaningInWord: string | null
}

export function useWordsForKanji(kanjiId: number | undefined) {
  const { data: wordKanji, isLoading: wkLoading, isError: wkError } = useWordKanjiList()
  const { data: kotoba, isLoading: kotobaLoading, isError: kotobaError } = useKotobaList()

  const words = useMemo<WordUsingKanji[]>(() => {
    if (!wordKanji || !kotoba || kanjiId == null) return []
    const kotobaById = new Map(kotoba.map((k) => [k.id, k]))
    return wordKanji
      .filter((link) => link.kanji_id === kanjiId && link.word_id != null)
      .map((link) => {
        const word = kotobaById.get(link.word_id!)
        return word
          ? {
              wordId: word.id,
              word: word.word,
              reading: word.reading,
              kanjiMeaningInWord: link.kanji_meaning_in_word,
            }
          : null
      })
      .filter((w): w is WordUsingKanji => w !== null)
  }, [wordKanji, kotoba, kanjiId])

  return {
    data: words,
    isLoading: wkLoading || kotobaLoading,
    isError: wkError || kotobaError,
  }
}
