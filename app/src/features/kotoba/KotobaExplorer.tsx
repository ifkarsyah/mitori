import { useMemo, useState } from 'react'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { Badge } from '@/components/ui/badge'
import type { Kotoba } from './api'
import {
  ALL,
  applyKotobaFilters,
  contextLabel,
  defaultKotobaFilterState,
  distinctContextIds,
  distinctFieldValues,
  distinctJlptValues,
  groupKotobaBy,
  hasKanjiLabel,
  jlptLabel,
  partOfSpeechLabel,
  subPartOfSpeechLabel,
  type KotobaFilterState,
  type KotobaGroupBy,
} from './filters'

const columns: ColumnConfig<Kotoba>[] = [
  {
    key: 'word',
    header: 'Word',
    render: (row) => <span className="text-lg">{row.word}</span>,
    sortValue: (row) => row.word,
  },
  {
    key: 'reading',
    header: 'Reading',
    render: (row) => row.reading ?? <span className="text-muted-foreground">—</span>,
    sortValue: (row) => row.reading,
  },
  {
    key: 'jlpt',
    header: 'JLPT',
    render: (row) =>
      row.jlpt ? jlptLabel(row.jlpt) : <span className="text-muted-foreground">—</span>,
    sortValue: (row) => row.jlpt,
  },
  {
    key: 'part_of_speech',
    header: 'Part of speech',
    render: (row) =>
      row.part_of_speech ? (
        partOfSpeechLabel(row.part_of_speech)
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    sortValue: (row) => row.part_of_speech,
  },
  {
    key: 'sub_part_of_speech',
    header: 'Sub-type',
    render: (row) => row.sub_part_of_speech ?? <span className="text-muted-foreground">—</span>,
    sortValue: (row) => row.sub_part_of_speech,
  },
  {
    key: 'has_kanji',
    header: 'Kanji?',
    render: (row) => (row.has_kanji ? 'Yes' : 'No'),
    sortValue: (row) => (row.has_kanji ? 1 : 0),
  },
  {
    key: 'meanings',
    header: 'Meanings',
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {(row.meanings ?? []).slice(0, 2).map((meaning) => (
          <Badge key={meaning} variant="secondary">
            {meaning}
          </Badge>
        ))}
      </div>
    ),
  },
]

const BASE_GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'context', label: 'Context' },
  { value: 'part_of_speech', label: 'Part of speech' },
  { value: 'sub_part_of_speech', label: 'Sub part of speech' },
  { value: 'has_kanji', label: 'Has kanji' },
  { value: 'jlpt', label: 'JLPT' },
]

export type KotobaExplorerProps = {
  words: Kotoba[]
  contextNameById: Map<number, string>
  /** Set to false when already scoped to a single context (e.g. the context detail page). */
  includeContextFilter?: boolean
}

export function KotobaExplorer({
  words,
  contextNameById,
  includeContextFilter = true,
}: KotobaExplorerProps) {
  const [filters, setFilters] = useState<KotobaFilterState>(defaultKotobaFilterState)

  const contextOptions = useMemo(() => {
    const values = distinctContextIds(words)
    return [
      { value: ALL, label: 'All contexts' },
      ...values.map((v) => ({ value: v, label: contextLabel(v, contextNameById) })),
    ]
  }, [words, contextNameById])

  const partOfSpeechOptions = useMemo(() => {
    const values = distinctFieldValues(words, 'part_of_speech')
    return [
      { value: ALL, label: 'All parts of speech' },
      ...values.map((v) => ({ value: v, label: partOfSpeechLabel(v) })),
    ]
  }, [words])

  const subPartOfSpeechOptions = useMemo(() => {
    const values = distinctFieldValues(words, 'sub_part_of_speech')
    return [
      { value: ALL, label: 'All sub-types' },
      ...values.map((v) => ({ value: v, label: subPartOfSpeechLabel(v) })),
    ]
  }, [words])

  const jlptOptions = useMemo(() => {
    const values = distinctJlptValues(words)
    return [
      { value: ALL, label: 'All JLPT levels' },
      ...values.map((v) => ({ value: v, label: jlptLabel(v) })),
    ]
  }, [words])

  const hasKanjiOptions = [
    { value: ALL, label: 'All' },
    { value: 'true', label: hasKanjiLabel('true') },
    { value: 'false', label: hasKanjiLabel('false') },
  ]

  const fields: FilterFieldConfig[] = [
    ...(includeContextFilter
      ? [{ key: 'contextId', label: 'Context', options: contextOptions }]
      : []),
    { key: 'partOfSpeech', label: 'Part of speech', options: partOfSpeechOptions },
    { key: 'subPartOfSpeech', label: 'Sub-type', options: subPartOfSpeechOptions },
    { key: 'hasKanji', label: 'Has kanji', options: hasKanjiOptions },
    { key: 'jlpt', label: 'JLPT', options: jlptOptions },
  ]

  const groupByOptions = includeContextFilter
    ? BASE_GROUP_BY_OPTIONS
    : BASE_GROUP_BY_OPTIONS.filter((o) => o.value !== 'context')

  const groups = useMemo(() => {
    const filtered = applyKotobaFilters(words, filters)
    return groupKotobaBy(filtered, filters.groupBy, contextNameById)
  }, [words, filters, contextNameById])

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search word, reading, or meaning…"
        fields={fields}
        fieldValues={{
          contextId: filters.contextId,
          partOfSpeech: filters.partOfSpeech,
          subPartOfSpeech: filters.subPartOfSpeech,
          hasKanji: filters.hasKanji,
          jlpt: filters.jlpt,
        }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={groupByOptions}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as KotobaGroupBy }))}
        onClear={() => setFilters(defaultKotobaFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/kotoba/${row.id}`}
        emptyMessage="No kotoba match these filters."
      />
    </div>
  )
}
