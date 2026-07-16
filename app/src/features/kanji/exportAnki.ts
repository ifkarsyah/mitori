import type { Kanji } from './api'
import { clusterLabel, gradeLabel, jlptLabel } from './filters'

export const ANKI_HEADERS = ['Front', 'Back']

/** Front: the character. Back: meanings, grade, JLPT, cluster. */
export function buildKanjiAnkiRows(rows: Kanji[]): string[][] {
  return rows.map((row) => {
    const front = row.character ?? ''

    const backLines: string[] = [(row.meanings ?? []).join('; ')]
    if (row.grade) backLines.push(gradeLabel(row.grade))
    if (row.jlpt) backLines.push(jlptLabel(row.jlpt))
    if (row.cluster) backLines.push(clusterLabel(row.cluster))

    return [front, backLines.join('<br>')]
  })
}
