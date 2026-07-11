import { useMemo, useState } from 'react'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { useContextList, useKotobaList } from './hooks'
import type { Kotoba } from './api'
import {
  ALL,
  applyKotobaFilters,
  contextLabel,
  defaultKotobaFilterState,
  distinctContextIds,
  distinctFieldValues,
  groupKotobaBy,
  hasKanjiLabel,
  partOfSpeechLabel,
  subPartOfSpeechLabel,
  type KotobaFilterState,
  type KotobaGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'context', label: 'Context' },
  { value: 'part_of_speech', label: 'Part of speech' },
  { value: 'sub_part_of_speech', label: 'Sub part of speech' },
  { value: 'has_kanji', label: 'Has kanji' },
]

const columns: ColumnConfig<Kotoba>[] = [
  {
    key: 'word',
    header: 'Word',
    render: (row) => <span className="text-lg">{row.word}</span>,
  },
  {
    key: 'reading',
    header: 'Reading',
    render: (row) => row.reading ?? <span className="text-muted-foreground">—</span>,
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
  },
  {
    key: 'sub_part_of_speech',
    header: 'Sub-type',
    render: (row) => row.sub_part_of_speech ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'has_kanji',
    header: 'Kanji?',
    render: (row) => (row.has_kanji ? 'Yes' : 'No'),
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

export function KotobaDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useKotobaList()
  const { data: contexts } = useContextList()
  const [filters, setFilters] = useState<KotobaFilterState>(defaultKotobaFilterState)

  const contextNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of contexts ?? []) {
      if (c.name) map.set(c.id, c.name)
    }
    return map
  }, [contexts])

  const contextOptions = useMemo(() => {
    const values = distinctContextIds(data ?? [])
    return [
      { value: ALL, label: 'All contexts' },
      ...values.map((v) => ({ value: v, label: contextLabel(v, contextNameById) })),
    ]
  }, [data, contextNameById])

  const partOfSpeechOptions = useMemo(() => {
    const values = distinctFieldValues(data ?? [], 'part_of_speech')
    return [
      { value: ALL, label: 'All parts of speech' },
      ...values.map((v) => ({ value: v, label: partOfSpeechLabel(v) })),
    ]
  }, [data])

  const subPartOfSpeechOptions = useMemo(() => {
    const values = distinctFieldValues(data ?? [], 'sub_part_of_speech')
    return [
      { value: ALL, label: 'All sub-types' },
      ...values.map((v) => ({ value: v, label: subPartOfSpeechLabel(v) })),
    ]
  }, [data])

  const hasKanjiOptions = [
    { value: ALL, label: 'All' },
    { value: 'true', label: hasKanjiLabel('true') },
    { value: 'false', label: hasKanjiLabel('false') },
  ]

  const fields: FilterFieldConfig[] = [
    { key: 'contextId', label: 'Context', options: contextOptions },
    { key: 'partOfSpeech', label: 'Part of speech', options: partOfSpeechOptions },
    { key: 'subPartOfSpeech', label: 'Sub-type', options: subPartOfSpeechOptions },
    { key: 'hasKanji', label: 'Has kanji', options: hasKanjiOptions },
  ]

  const groups = useMemo(() => {
    const filtered = applyKotobaFilters(data ?? [], filters)
    return groupKotobaBy(filtered, filters.groupBy, contextNameById)
  }, [data, filters, contextNameById])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Kotoba</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} words total</p>
      </div>

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
        }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
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
