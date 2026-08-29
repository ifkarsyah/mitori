import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { ColumnVisibilityToggle } from '@/components/ColumnVisibilityToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { downloadCsv } from '@/lib/exportCsv'
import { useLanguage } from '@/features/language/useLanguage'
import type { Kotoba } from './api'
import { useSentencesList, useSourceList } from './hooks'
import { ANKI_HEADERS, buildKotobaAnkiRows, buildSentencesByWordId } from './exportAnki'
import {
  ALL,
  applyKotobaFilters,
  contextLabel,
  defaultKotobaFilterState,
  distinctContextIds,
  distinctFieldValues,
  distinctKanaTypeValues,
  distinctLevelValues,
  groupKotobaBy,
  levelLabel,
  partOfSpeechLabel,
  kanaTypeLabel,
  subPartOfSpeechLabel,
  type KotobaFilterState,
  type KotobaGroupBy,
} from './filters'

function buildColumns(
  contextNameById: Map<number, string>,
  sourceNameById: Map<number, string>,
  includeContextColumn: boolean,
  includeSourceColumn: boolean,
  caps: LanguageCaps,
): ColumnConfig<Kotoba>[] {
  return [
  {
    key: 'word',
    header: 'Word',
    render: (row) => (
      <Link
        to={`/kotoba/${row.word}`}
        className="text-lg hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {/* German nouns read naturally with their article, but sort by the bare word. */}
        {row.gender ? `${row.gender} ${row.word}` : row.word}
      </Link>
    ),
    sortValue: (row) => row.word,
  },
  ...(caps.hasReading
    ? [
        {
          key: 'reading',
          header: 'Reading',
          render: (row: Kotoba) => row.reading ?? <span className="text-muted-foreground">—</span>,
          sortValue: (row: Kotoba) => row.reading,
        },
      ]
    : []),
  ...(caps.hasGender
    ? [
        {
          key: 'plural',
          header: 'Plural',
          render: (row: Kotoba) => row.plural ?? <span className="text-muted-foreground">—</span>,
          sortValue: (row: Kotoba) => row.plural,
        },
      ]
    : []),
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
  ...(includeContextColumn
    ? [
        {
          key: 'context',
          header: 'Context',
          render: (row: Kotoba) =>
            row.context_id != null ? (
              <Link
                to={`/context/${row.context_id}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {contextLabel(String(row.context_id), contextNameById)}
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
          sortValue: (row: Kotoba) =>
            row.context_id != null ? contextLabel(String(row.context_id), contextNameById) : null,
        },
      ]
    : []),
  ...(includeSourceColumn
    ? [
        {
          key: 'source',
          header: 'Source',
          render: (row: Kotoba) =>
            row.source_id != null && sourceNameById.has(row.source_id) ? (
              <Link
                to={`/source/${row.source_id}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {sourceNameById.get(row.source_id)}
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
          sortValue: (row: Kotoba) => (row.source_id != null ? sourceNameById.get(row.source_id) ?? null : null),
        },
      ]
    : []),
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
    // One column across scales; the header names whichever the language uses.
    key: 'level',
    header: caps.levelName,
    render: (row) => (row.level ? levelLabel(row.level) : <span className="text-muted-foreground">—</span>),
    sortValue: (row) => row.level,
  },
  ...(caps.hasKana
    ? [
        {
          key: 'kana_type',
          header: 'Kana type',
          render: (row: Kotoba) =>
            row.kana_type ? (
              kanaTypeLabel(row.kana_type)
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
          sortValue: (row: Kotoba) => row.kana_type,
        },
      ]
    : []),
  ]
}

/** What the selected language supports, so columns and filters follow the data. */
type LanguageCaps = {
  hasReading: boolean
  hasGender: boolean
  hasKana: boolean
  levelName: string
}

const BASE_GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'context', label: 'Context' },
  { value: 'part_of_speech', label: 'Part of speech' },
  { value: 'sub_part_of_speech', label: 'Sub part of speech' },
  { value: 'level', label: 'Level' },
]

export type KotobaExplorerProps = {
  words: Kotoba[]
  contextNameById: Map<number, string>
  /** Set to false when already scoped to a single context (e.g. the context detail page). */
  includeContextFilter?: boolean
  /** Set to false when every row shares the same context, making the column redundant (e.g. the context detail page). */
  includeContextColumn?: boolean
  /** Set to false when every row shares the same source, making the column redundant (e.g. the source detail page). */
  includeSourceColumn?: boolean
}

export function KotobaExplorer({
  words,
  contextNameById,
  includeContextFilter = true,
  includeContextColumn = true,
  includeSourceColumn = true,
}: KotobaExplorerProps) {
  const [filters, setFilters] = useState<KotobaFilterState>(defaultKotobaFilterState)
  const { current, labelFor, language } = useLanguage()
  const caps = useMemo<LanguageCaps>(
    () => ({
      hasReading: current?.has_reading ?? false,
      hasGender: current?.has_gender ?? false,
      // kana_type is specific to the Japanese writing system, not to characters
      // generally — Chinese has characters but no kana.
      hasKana: current?.script === 'japanese',
      levelName: current?.level_system?.toUpperCase() ?? 'Level',
    }),
    [current],
  )
  const { data: sources } = useSourceList()
  const { data: sentences } = useSentencesList()
  const sourceNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of sources ?? []) map.set(s.id, s.name)
    return map
  }, [sources])
  const sentencesByWordId = useMemo(() => buildSentencesByWordId(sentences ?? []), [sentences])
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  const columns = useMemo(
    () =>
      buildColumns(contextNameById, sourceNameById, includeContextColumn, includeSourceColumn, caps),
    [contextNameById, sourceNameById, includeContextColumn, includeSourceColumn, caps],
  )

  function toggleColumn(key: string) {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

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

  const levelOptions = useMemo(() => {
    const values = distinctLevelValues(words)
    return [
      { value: ALL, label: `All ${caps.levelName} levels` },
      ...values.map((v) => ({ value: v, label: levelLabel(v) })),
    ]
  }, [words, caps.levelName])

  const kanaTypeOptions = useMemo(() => {
    const values = distinctKanaTypeValues(words)
    return [
      { value: ALL, label: 'All kana types' },
      ...values.map((v) => ({ value: v, label: kanaTypeLabel(v) })),
    ]
  }, [words])

  const fields: FilterFieldConfig[] = [
    ...(includeContextFilter
      ? [{ key: 'contextId', label: 'Context', options: contextOptions }]
      : []),
    { key: 'partOfSpeech', label: 'Part of speech', options: partOfSpeechOptions },
    { key: 'subPartOfSpeech', label: 'Sub-type', options: subPartOfSpeechOptions },
    { key: 'level', label: caps.levelName, options: levelOptions },
    // Kana type only means anything for the Japanese writing system.
    ...(caps.hasKana ? [{ key: 'kana_type', label: 'Kana type', options: kanaTypeOptions }] : []),
  ]

  const allGroupByOptions = caps.hasKana
    ? [...BASE_GROUP_BY_OPTIONS, { value: 'kana_type', label: 'Kana type' }]
    : BASE_GROUP_BY_OPTIONS
  const groupByOptions = includeContextFilter
    ? allGroupByOptions
    : allGroupByOptions.filter((o) => o.value !== 'context')

  const groups = useMemo(() => {
    const filtered = applyKotobaFilters(words, filters)
    return groupKotobaBy(filtered, filters.groupBy, contextNameById)
  }, [words, filters, contextNameById])

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumns.has(c.key)),
    [columns, hiddenColumns],
  )

  function exportToAnki() {
    const filteredRows = groups.flatMap((g) => g.rows)
    const ankiRows = buildKotobaAnkiRows(filteredRows, sentencesByWordId)
    downloadCsv('mitori-kotoba-anki.csv', ANKI_HEADERS, ankiRows)
  }

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
          kana_type: filters.kana_type,
          level: filters.level,
        }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={groupByOptions}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as KotobaGroupBy }))}
        onClear={() => setFilters(defaultKotobaFilterState)}
      />

      <div className="flex items-center justify-between gap-2">
        <ColumnVisibilityToggle
          columns={columns.filter((c) => c.key !== 'word').map((c) => ({ key: c.key, label: c.header }))}
          hiddenKeys={hiddenColumns}
          onToggle={toggleColumn}
        />
        <Button type="button" variant="outline" size="sm" onClick={exportToAnki}>
          Export to Anki (CSV)
        </Button>
      </div>

      <GroupedTable
        groups={groups}
        columns={visibleColumns}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/kotoba/${row.word}`}
        emptyMessage={
          words.length === 0
            ? `No ${labelFor(language)} words yet.`
            : 'No kotoba match these filters.'
        }
      />
    </div>
  )
}
