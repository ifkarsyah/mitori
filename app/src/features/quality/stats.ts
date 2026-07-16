import type { Kotoba, WordKanji, Sentence, SentenceKotoba } from '@/features/kotoba/api'
import type { Kanji } from '@/features/kanji/api'

export type CompletenessStat = {
  key: string
  label: string
  total: number
  filled: number
  percent: number
}

export type StructuralCheck = {
  key: string
  label: string
  passed: boolean
  detail: string
}

function completeness(
  total: number,
  countNull: (row: { [k: string]: unknown }) => boolean,
  rows: Array<Record<string, unknown>>,
  key: string,
  label: string,
): CompletenessStat {
  const filled = rows.filter((row) => !countNull(row)).length
  return { key, label, total, filled, percent: total === 0 ? 0 : (filled / total) * 100 }
}

export function kotobaCompleteness(rows: Kotoba[]): CompletenessStat[] {
  const total = rows.length
  return [
    completeness(total, (r) => r.context_id == null, rows, 'context_id', 'Context'),
    completeness(total, (r) => r.source_id == null, rows, 'source_id', 'Source'),
    completeness(total, (r) => r.jlpt == null, rows, 'jlpt', 'JLPT level'),
    completeness(total, (r) => r.sub_part_of_speech == null, rows, 'sub_part_of_speech', 'Sub part of speech'),
  ]
}

export function kanjiCompleteness(rows: Kanji[]): CompletenessStat[] {
  const total = rows.length
  return [
    completeness(total, (r) => r.cluster == null, rows, 'cluster', 'Cluster'),
    completeness(total, (r) => r.jlpt == null, rows, 'jlpt', 'JLPT level'),
    completeness(total, (r) => r.grade == null, rows, 'grade', 'Grade'),
  ]
}

export function sentenceCompleteness(rows: Sentence[]): CompletenessStat[] {
  const total = rows.length
  return [
    completeness(total, (r) => r.context_id == null, rows, 'context_id', 'Context'),
    completeness(total, (r) => r.meaning == null, rows, 'meaning', 'Meaning'),
  ]
}

export function structuralChecks(data: {
  kotoba: Kotoba[]
  sentences: Sentence[]
  wordKanji: WordKanji[]
  sentenceKotoba: SentenceKotoba[]
}): StructuralCheck[] {
  const { kotoba, sentences, wordKanji, sentenceKotoba } = data

  const linkedSentenceIds = new Set(sentenceKotoba.map((link) => link.sentence_id))
  const sentencesWithoutWords = sentences.filter((s) => !linkedSentenceIds.has(s.id))

  const wordIdsWithKanjiLink = new Set(wordKanji.map((link) => link.word_id))
  const kanjiWordsMissingBreakdown = kotoba.filter(
    (k) => k.kana_type === 'kanji' && !wordIdsWithKanjiLink.has(k.id),
  )

  const wordGroups = new Map<string, number>()
  for (const k of kotoba) {
    wordGroups.set(k.word, (wordGroups.get(k.word) ?? 0) + 1)
  }
  const duplicateWordGroups = [...wordGroups.values()].filter((count) => count > 1).length

  const sentenceTextGroups = new Map<string, number>()
  for (const s of sentences) {
    if (!s.sentence) continue
    sentenceTextGroups.set(s.sentence, (sentenceTextGroups.get(s.sentence) ?? 0) + 1)
  }
  const duplicateSentenceGroups = [...sentenceTextGroups.values()].filter((count) => count > 1).length

  return [
    {
      key: 'sentences_linked',
      label: 'Every sentence links to at least one kotoba word',
      passed: sentencesWithoutWords.length === 0,
      detail: `${sentences.length - sentencesWithoutWords.length} / ${sentences.length}`,
    },
    {
      key: 'no_duplicate_words',
      label: 'No duplicate word text in kotoba',
      passed: duplicateWordGroups === 0,
      detail: `${duplicateWordGroups} group${duplicateWordGroups === 1 ? '' : 's'}`,
    },
    {
      key: 'kanji_breakdown',
      label: 'Kanji-type words have a word_kanji breakdown',
      passed: kanjiWordsMissingBreakdown.length === 0,
      detail: `${kanjiWordsMissingBreakdown.length} row${kanjiWordsMissingBreakdown.length === 1 ? '' : 's'} missing`,
    },
    {
      key: 'no_duplicate_sentences',
      label: 'No sentences with identical text to another sentence',
      passed: duplicateSentenceGroups === 0,
      detail: `${duplicateSentenceGroups} group${duplicateSentenceGroups === 1 ? '' : 's'}`,
    },
  ]
}
