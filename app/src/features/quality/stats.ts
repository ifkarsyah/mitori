import type { Kotoba, WordKanji, Sentence, SentenceKotoba } from '@/features/kotoba/api'
import type { Kanji } from '@/features/kanji/api'

export type AffectedRow = { key: string; label: string; href: string }

export type CompletenessStat = {
  key: string
  label: string
  total: number
  filled: number
  percent: number
  missingRows: AffectedRow[]
}

export type StructuralCheck = {
  key: string
  label: string
  passed: boolean
  detail: string
  affectedRows: AffectedRow[]
}

function toStat(key: string, label: string, total: number, missingRows: AffectedRow[]): CompletenessStat {
  const filled = total - missingRows.length
  return { key, label, total, filled, percent: total === 0 ? 0 : (filled / total) * 100, missingRows }
}

function kotobaAffectedRow(row: Kotoba): AffectedRow {
  return { key: String(row.id), label: row.word, href: `/kotoba/${encodeURIComponent(row.word)}` }
}

function kanjiAffectedRow(row: Kanji): AffectedRow | null {
  if (!row.character) return null
  return { key: String(row.id), label: row.character, href: `/kanji/${encodeURIComponent(row.character)}` }
}

function sentenceAffectedRow(row: Sentence, kotobaById: Map<number, Kotoba>): AffectedRow | null {
  const word = row.word_id != null ? kotobaById.get(row.word_id) : undefined
  if (!word) return null
  return {
    key: String(row.id),
    label: `${word.word}: ${row.sentence ?? ''}`,
    href: `/kotoba/${encodeURIComponent(word.word)}`,
  }
}

export function kotobaCompleteness(rows: Kotoba[]): CompletenessStat[] {
  const missing = (isNull: (row: Kotoba) => boolean) => rows.filter(isNull).map(kotobaAffectedRow)
  // sub_part_of_speech (godan/ichidan/irregular verb, i/na-adjective) only applies to verbs and
  // adjectives — nouns correctly have no value here, so they're excluded from this stat's denominator.
  const subtypeApplicable = rows.filter((r) => r.part_of_speech === 'verb' || r.part_of_speech === 'adjective')
  const missingSubtype = subtypeApplicable.filter((r) => r.sub_part_of_speech == null).map(kotobaAffectedRow)
  return [
    toStat('context_id', 'Context', rows.length, missing((r) => r.context_id == null)),
    toStat('source_id', 'Source', rows.length, missing((r) => r.source_id == null)),
    toStat('jlpt', 'JLPT level', rows.length, missing((r) => r.jlpt == null)),
    toStat('sub_part_of_speech', 'Sub part of speech (verbs/adjectives)', subtypeApplicable.length, missingSubtype),
  ]
}

export function kanjiCompleteness(rows: Kanji[]): CompletenessStat[] {
  const missing = (isNull: (row: Kanji) => boolean) =>
    rows.filter(isNull).map(kanjiAffectedRow).filter((r): r is AffectedRow => r !== null)
  return [
    toStat('cluster', 'Cluster', rows.length, missing((r) => r.cluster == null)),
    toStat('jlpt', 'JLPT level', rows.length, missing((r) => r.jlpt == null)),
    toStat('grade', 'Grade', rows.length, missing((r) => r.grade == null)),
  ]
}

export function sentenceCompleteness(rows: Sentence[], kotobaById: Map<number, Kotoba>): CompletenessStat[] {
  const missing = (isNull: (row: Sentence) => boolean) =>
    rows
      .filter(isNull)
      .map((r) => sentenceAffectedRow(r, kotobaById))
      .filter((r): r is AffectedRow => r !== null)
  return [
    toStat('context_id', 'Context', rows.length, missing((r) => r.context_id == null)),
    toStat('meaning', 'Meaning', rows.length, missing((r) => r.meaning == null)),
  ]
}

export function structuralChecks(data: {
  kotoba: Kotoba[]
  sentences: Sentence[]
  wordKanji: WordKanji[]
  sentenceKotoba: SentenceKotoba[]
  kotobaById: Map<number, Kotoba>
}): StructuralCheck[] {
  const { kotoba, sentences, wordKanji, sentenceKotoba, kotobaById } = data

  const linkedSentenceIds = new Set(sentenceKotoba.map((link) => link.sentence_id))
  const sentencesWithoutWords = sentences.filter((s) => !linkedSentenceIds.has(s.id))

  const wordIdsWithKanjiLink = new Set(wordKanji.map((link) => link.word_id))
  const kanjiWordsMissingBreakdown = kotoba.filter(
    (k) => k.kana_type === 'kanji' && !wordIdsWithKanjiLink.has(k.id),
  )

  const wordGroups = new Map<string, Kotoba[]>()
  for (const k of kotoba) {
    const list = wordGroups.get(k.word)
    if (list) list.push(k)
    else wordGroups.set(k.word, [k])
  }
  const duplicateWordGroupLists = [...wordGroups.values()].filter((group) => group.length > 1)

  const sentenceTextGroups = new Map<string, Sentence[]>()
  for (const s of sentences) {
    if (!s.sentence) continue
    const list = sentenceTextGroups.get(s.sentence)
    if (list) list.push(s)
    else sentenceTextGroups.set(s.sentence, [s])
  }
  const duplicateSentenceGroupLists = [...sentenceTextGroups.values()].filter((group) => group.length > 1)

  return [
    {
      key: 'sentences_linked',
      label: 'Every sentence links to at least one kotoba word',
      passed: sentencesWithoutWords.length === 0,
      detail: `${sentences.length - sentencesWithoutWords.length} / ${sentences.length}`,
      affectedRows: sentencesWithoutWords
        .map((r) => sentenceAffectedRow(r, kotobaById))
        .filter((r): r is AffectedRow => r !== null),
    },
    {
      key: 'no_duplicate_words',
      label: 'No duplicate word text in kotoba',
      passed: duplicateWordGroupLists.length === 0,
      detail: `${duplicateWordGroupLists.length} group${duplicateWordGroupLists.length === 1 ? '' : 's'}`,
      affectedRows: duplicateWordGroupLists.flat().map(kotobaAffectedRow),
    },
    {
      key: 'kanji_breakdown',
      label: 'Kanji-type words have a word_kanji breakdown',
      passed: kanjiWordsMissingBreakdown.length === 0,
      detail: `${kanjiWordsMissingBreakdown.length} row${kanjiWordsMissingBreakdown.length === 1 ? '' : 's'} missing`,
      affectedRows: kanjiWordsMissingBreakdown.map(kotobaAffectedRow),
    },
    {
      key: 'no_duplicate_sentences',
      label: 'No sentences with identical text to another sentence',
      passed: duplicateSentenceGroupLists.length === 0,
      detail: `${duplicateSentenceGroupLists.length} group${duplicateSentenceGroupLists.length === 1 ? '' : 's'}`,
      affectedRows: duplicateSentenceGroupLists
        .flat()
        .map((r) => sentenceAffectedRow(r, kotobaById))
        .filter((r): r is AffectedRow => r !== null),
    },
  ]
}
