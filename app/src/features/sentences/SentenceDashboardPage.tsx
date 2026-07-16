import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { downloadCsv } from '@/lib/exportCsv'
import type { EnrichedSentence, LinkedWord } from './hooks'
import { useSentencesWithWords } from './hooks'
import { ANKI_HEADERS, buildSentenceAnkiRows } from './exportAnki'
import {
  ALL,
  applySentenceFilters,
  contextLabel,
  defaultSentenceFilterState,
  distinctFieldValues,
  groupSentencesBy,
  jlptLabel,
  kanaTypeLabel,
  partOfSpeechLabel,
  type SentenceFilterState,
  type SentenceGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'context', label: 'Context' },
  { value: 'jlpt', label: 'JLPT' },
  { value: 'part_of_speech', label: 'Part of speech' },
  { value: 'kana_type', label: 'Kana type' },
]

const POS_ORDER = ['noun', 'verb', 'adjective', 'other']
const POS_LABEL: Record<string, string> = { noun: 'N', verb: 'V', adjective: 'Adj', other: 'Other' }

function groupWordsByPartOfSpeech(words: LinkedWord[]) {
  const buckets = new Map<string, LinkedWord[]>()
  for (const w of words) {
    const key = w.partOfSpeech ?? 'other'
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(w)
    } else {
      buckets.set(key, [w])
    }
  }
  const orderedKeys = [...POS_ORDER.filter((k) => buckets.has(k)), ...[...buckets.keys()].filter((k) => !POS_ORDER.includes(k))]
  return orderedKeys.map((key) => ({ key, label: POS_LABEL[key] ?? key, words: buckets.get(key)! }))
}

const columns: ColumnConfig<EnrichedSentence>[] = [
  {
    key: 'sentence',
    header: 'Sentence',
    render: (row) =>
      row.word != null ? (
        <Link
          to={`/kotoba/${row.word}`}
          className="text-lg hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.sentence}
        </Link>
      ) : (
        <span className="text-lg">{row.sentence}</span>
      ),
    sortValue: (row) => row.sentence,
  },
  {
    key: 'meaning',
    header: 'Meaning',
    render: (row) => row.meaning ?? <span className="text-muted-foreground">—</span>,
    sortValue: (row) => row.meaning,
  },
  {
    key: 'words',
    header: 'Words',
    render: (row) =>
      row.linkedWords.length === 0 ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <div className="flex flex-col gap-1">
          {groupWordsByPartOfSpeech(row.linkedWords).map((group) => (
            <div key={group.key} className="flex flex-wrap items-center gap-1">
              <span className="text-xs text-muted-foreground">{group.label}:</span>
              {group.words.map((w) => (
                <Link key={w.id} to={`/kotoba/${w.word}`} onClick={(e) => e.stopPropagation()}>
                  <Badge variant="secondary">{w.word}</Badge>
                </Link>
              ))}
            </div>
          ))}
        </div>
      ),
    sortValue: (row) => row.word,
  },
  {
    key: 'context',
    header: 'Context',
    render: (row) =>
      row.contextId != null && row.context ? (
        <Link
          to={`/context/${row.contextId}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.context}
        </Link>
      ) : (
        (row.context ?? <span className="text-muted-foreground">—</span>)
      ),
    sortValue: (row) => row.context,
  },
  {
    key: 'jlpt',
    header: 'JLPT',
    render: (row) =>
      row.jlpt ? jlptLabel(row.jlpt) : <span className="text-muted-foreground">—</span>,
    sortValue: (row) => row.jlpt,
  },
]

export function SentenceDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useSentencesWithWords()
  const [filters, setFilters] = useState<SentenceFilterState>(defaultSentenceFilterState)

  const jlptOptions = useMemo(() => {
    const values = distinctFieldValues(data, 'jlpt')
    return [{ value: ALL, label: 'All JLPT levels' }, ...values.map((v) => ({ value: v, label: jlptLabel(v) }))]
  }, [data])

  const partOfSpeechOptions = useMemo(() => {
    const values = distinctFieldValues(data, 'partOfSpeech')
    return [
      { value: ALL, label: 'All parts of speech' },
      ...values.map((v) => ({ value: v, label: partOfSpeechLabel(v) })),
    ]
  }, [data])

  const kanaTypeOptions = useMemo(() => {
    const values = distinctFieldValues(data, 'kanaType')
    return [
      { value: ALL, label: 'All kana types' },
      ...values.map((v) => ({ value: v, label: kanaTypeLabel(v) })),
    ]
  }, [data])

  const contextOptions = useMemo(() => {
    const values = distinctFieldValues(data, 'context')
    return [
      { value: ALL, label: 'All contexts' },
      ...values.map((v) => ({ value: v, label: contextLabel(v) })),
    ]
  }, [data])

  const fields: FilterFieldConfig[] = [
    { key: 'context', label: 'Context', options: contextOptions },
    { key: 'partOfSpeech', label: 'Part of speech', options: partOfSpeechOptions },
    { key: 'kanaType', label: 'Kana type', options: kanaTypeOptions },
    { key: 'jlpt', label: 'JLPT', options: jlptOptions },
  ]

  const groups = useMemo(() => {
    const filtered = applySentenceFilters(data, filters)
    return groupSentencesBy(filtered, filters.groupBy)
  }, [data, filters])

  function exportToAnki() {
    const filteredRows = groups.flatMap((g) => g.rows)
    downloadCsv('mitori-sentences-anki.csv', ANKI_HEADERS, buildSentenceAnkiRows(filteredRows))
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Sentences</h1>
        <p className="text-sm text-muted-foreground">{data.length} example sentences</p>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search sentence, meaning, or word…"
        fields={fields}
        fieldValues={{
          context: filters.context,
          partOfSpeech: filters.partOfSpeech,
          kanaType: filters.kanaType,
          jlpt: filters.jlpt,
        }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as SentenceGroupBy }))}
        onClear={() => setFilters(defaultSentenceFilterState)}
      />

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={exportToAnki}>
          Export to Anki (CSV)
        </Button>
      </div>

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => (row.word != null ? `/kotoba/${row.word}` : '#')}
        emptyMessage="No sentences match these filters."
      />
    </div>
  )
}
