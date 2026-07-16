import type { Kotoba, Sentence } from './api'
import { jlptLabel, partOfSpeechLabel, subPartOfSpeechLabel } from './filters'

export const ANKI_HEADERS = ['Front', 'Back']

export function buildSentencesByWordId(sentences: Sentence[]): Map<number, Sentence[]> {
  const map = new Map<number, Sentence[]>()
  for (const s of sentences) {
    if (s.word_id == null) continue
    const list = map.get(s.word_id)
    if (list) {
      list.push(s)
    } else {
      map.set(s.word_id, [s])
    }
  }
  return map
}

/** Front: word + one example sentence, both in Japanese. Back: reading, meanings, part of speech, JLPT. */
export function buildKotobaAnkiRows(rows: Kotoba[], sentencesByWordId: Map<number, Sentence[]>): string[][] {
  return rows.map((row) => {
    const example = sentencesByWordId.get(row.id)?.[0]?.sentence
    const front = example ? `${row.word}<br>${example}` : row.word

    const backLines: string[] = []
    if (row.reading) backLines.push(row.reading)
    backLines.push((row.meanings ?? []).join('; '))
    if (row.part_of_speech) {
      const pos = partOfSpeechLabel(row.part_of_speech)
      const subtype = row.sub_part_of_speech ? subPartOfSpeechLabel(row.sub_part_of_speech) : null
      backLines.push(subtype ? `${pos} (${subtype})` : pos)
    }
    if (row.jlpt) backLines.push(jlptLabel(row.jlpt))

    return [front, backLines.join('<br>')]
  })
}
