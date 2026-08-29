import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import type { Kotoba } from '@/features/kotoba/api'
import { useConceptRows, type ConceptRow } from './hooks'
import {
  ALL,
  applyConceptFilters,
  coverageLabel,
  defaultConceptFilterState,
  distinctCoverageValues,
  distinctPartOfSpeechValues,
  groupConceptsBy,
  partOfSpeechLabel,
  type ConceptFilterState,
  type ConceptGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'coverage', label: 'Coverage' },
  { value: 'part_of_speech', label: 'Part of speech' },
]

function WordList({ words }: { words: Kotoba[] }) {
  if (words.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {words.map((w) => (
        <Link
          key={w.id}
          to={`/kotoba/${w.word}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {w.gender ? `${w.gender} ${w.word}` : w.word}
        </Link>
      ))}
    </div>
  )
}

const columns: ColumnConfig<ConceptRow>[] = [
  {
    key: 'gloss',
    header: 'Concept',
    render: (row) => (
      <Link
        to={`/concept/${row.concept.id}`}
        className="text-lg hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.concept.gloss}
      </Link>
    ),
    sortValue: (row) => row.concept.gloss,
  },
  {
    key: 'ja',
    header: 'Japanese',
    render: (row) => <WordList words={row.ja} />,
    sortValue: (row) => row.ja[0]?.word ?? null,
  },
  {
    key: 'de',
    header: 'German',
    render: (row) => <WordList words={row.de} />,
    sortValue: (row) => row.de[0]?.word ?? null,
  },
  {
    key: 'part_of_speech',
    header: 'Part of speech',
    render: (row) =>
      row.concept.part_of_speech ? (
        partOfSpeechLabel(row.concept.part_of_speech)
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    sortValue: (row) => row.concept.part_of_speech,
  },
]

export function ConceptDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useConceptRows()
  const [filters, setFilters] = useState<ConceptFilterState>(defaultConceptFilterState)

  const partOfSpeechOptions = useMemo(() => {
    const values = distinctPartOfSpeechValues(data)
    return [
      { value: ALL, label: 'All parts of speech' },
      ...values.map((v) => ({ value: v, label: partOfSpeechLabel(v) })),
    ]
  }, [data])

  const coverageOptions = useMemo(() => {
    const values = distinctCoverageValues(data)
    return [
      { value: ALL, label: 'All coverage' },
      ...values.map((v) => ({ value: v, label: coverageLabel(v) })),
    ]
  }, [data])

  const fields: FilterFieldConfig[] = [
    { key: 'coverage', label: 'Coverage', options: coverageOptions },
    { key: 'partOfSpeech', label: 'Part of speech', options: partOfSpeechOptions },
  ]

  const groups = useMemo(
    () => groupConceptsBy(applyConceptFilters(data, filters), filters.groupBy),
    [data, filters],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Concept</h1>
        <p className="text-sm text-muted-foreground">
          {data.length} concepts — one shared meaning, realized once per language
        </p>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search concept or word…"
        fields={fields}
        fieldValues={{ coverage: filters.coverage, partOfSpeech: filters.partOfSpeech }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as ConceptGroupBy }))}
        onClear={() => setFilters(defaultConceptFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.concept.id}
        getRowHref={(row) => `/concept/${row.concept.id}`}
        emptyMessage="No concepts match these filters."
      />
    </div>
  )
}
