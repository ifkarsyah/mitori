import type { EnrichedSentence } from './hooks'
import { jlptLabel, partOfSpeechLabel } from './filters'

export const ANKI_HEADERS = ['Front', 'Back']

/** Blanks the first occurrence of `word` in `sentence`. Falls back to the sentence
 *  unchanged when the word doesn't appear verbatim (e.g. a conjugated verb/adjective form). */
function blankWord(sentence: string, word: string): string {
  if (!sentence.includes(word)) return sentence
  return sentence.replace(word, '_____')
}

/** Front: the example sentence with the target word blanked out (Japanese only).
 *  Back: the word, its reading, the sentence's translation, part of speech, and JLPT. */
export function buildSentenceAnkiRows(rows: EnrichedSentence[]): string[][] {
  return rows
    .filter((row): row is EnrichedSentence & { sentence: string; word: string } =>
      row.sentence != null && row.word != null,
    )
    .map((row) => {
      const front = blankWord(row.sentence, row.word)

      const backLines: string[] = [row.word]
      if (row.wordReading) backLines.push(row.wordReading)
      if (row.meaning) backLines.push(row.meaning)
      if (row.partOfSpeech) backLines.push(partOfSpeechLabel(row.partOfSpeech))
      if (row.jlpt) backLines.push(jlptLabel(row.jlpt))

      return [front, backLines.join('<br>')]
    })
}
