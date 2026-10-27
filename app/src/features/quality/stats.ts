import type { Word, WordKanji, Sentence, SentenceWord } from '@/features/word/api'
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

function wordAffectedRow(row: Word): AffectedRow {
  return { key: String(row.id), label: row.word, href: `/word/${encodeURIComponent(row.word)}` }
}

function kanjiAffectedRow(row: Kanji): AffectedRow | null {
  if (!row.character) return null
  return { key: String(row.id), label: row.character, href: `/kanji/${encodeURIComponent(row.character)}` }
}

function sentenceAffectedRow(row: Sentence, wordById: Map<number, Word>): AffectedRow | null {
  const word = row.word_id != null ? wordById.get(row.word_id) : undefined
  if (!word) return null
  return {
    key: String(row.id),
    label: `${word.word}: ${row.sentence ?? ''}`,
    href: `/word/${encodeURIComponent(word.word)}`,
  }
}

export function wordCompleteness(rows: Word[]): CompletenessStat[] {
  const missing = (isNull: (row: Word) => boolean) => rows.filter(isNull).map(wordAffectedRow)
  // sub_part_of_speech (godan/ichidan/irregular verb, i/na-adjective) only applies to verbs and
  // adjectives — nouns correctly have no value here, so they're excluded from this stat's denominator.
  const subtypeApplicable = rows.filter((r) => r.part_of_speech === 'verb' || r.part_of_speech === 'adjective')
  const missingSubtype = subtypeApplicable.filter((r) => r.sub_part_of_speech == null).map(wordAffectedRow)
  return [
    toStat('meaning_id', 'Shared meaning', rows.length, missing((r) => r.meaning_id == null)),
    toStat('source_id', 'Source', rows.length, missing((r) => r.source_id == null)),
    // One stat across scales: JLPT, CEFR and HSK all live in word.level.
    toStat('level', 'Level', rows.length, missing((r) => r.level == null)),
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

export function sentenceCompleteness(rows: Sentence[], wordById: Map<number, Word>): CompletenessStat[] {
  const missing = (isNull: (row: Sentence) => boolean) =>
    rows
      .filter(isNull)
      .map((r) => sentenceAffectedRow(r, wordById))
      .filter((r): r is AffectedRow => r !== null)
  return [
    toStat('category_id', 'Category', rows.length, missing((r) => r.category_id == null)),
    toStat('meaning', 'Meaning', rows.length, missing((r) => r.meaning == null)),
  ]
}

export function structuralChecks(data: {
  words: Word[]
  sentences: Sentence[]
  wordKanji: WordKanji[]
  sentenceWord: SentenceWord[]
  wordById: Map<number, Word>
}): StructuralCheck[] {
  const { words, sentences, wordKanji, sentenceWord, wordById } = data

  const linkedSentenceIds = new Set(sentenceWord.map((link) => link.sentence_id))
  const sentencesWithoutWords = sentences.filter((s) => !linkedSentenceIds.has(s.id))

  const wordIdsWithKanjiLink = new Set(wordKanji.map((link) => link.word_id))
  const kanjiWordsMissingBreakdown = words.filter(
    (k) => k.kana_type === 'kanji' && !wordIdsWithKanjiLink.has(k.id),
  )

  const wordGroups = new Map<string, Word[]>()
  for (const k of words) {
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
      label: 'Every sentence links to at least one word',
      passed: sentencesWithoutWords.length === 0,
      detail: `${sentences.length - sentencesWithoutWords.length} / ${sentences.length}`,
      affectedRows: sentencesWithoutWords
        .map((r) => sentenceAffectedRow(r, wordById))
        .filter((r): r is AffectedRow => r !== null),
    },
    {
      key: 'no_duplicate_words',
      label: 'No duplicate word text',
      passed: duplicateWordGroupLists.length === 0,
      detail: `${duplicateWordGroupLists.length} group${duplicateWordGroupLists.length === 1 ? '' : 's'}`,
      affectedRows: duplicateWordGroupLists.flat().map(wordAffectedRow),
    },
    {
      key: 'kanji_breakdown',
      label: 'Kanji-type words have a word_kanji breakdown',
      passed: kanjiWordsMissingBreakdown.length === 0,
      detail: `${kanjiWordsMissingBreakdown.length} row${kanjiWordsMissingBreakdown.length === 1 ? '' : 's'} missing`,
      affectedRows: kanjiWordsMissingBreakdown.map(wordAffectedRow),
    },
    {
      key: 'no_duplicate_sentences',
      label: 'No sentences with identical text to another sentence',
      passed: duplicateSentenceGroupLists.length === 0,
      detail: `${duplicateSentenceGroupLists.length} group${duplicateSentenceGroupLists.length === 1 ? '' : 's'}`,
      affectedRows: duplicateSentenceGroupLists
        .flat()
        .map((r) => sentenceAffectedRow(r, wordById))
        .filter((r): r is AffectedRow => r !== null),
    },
  ]
}
