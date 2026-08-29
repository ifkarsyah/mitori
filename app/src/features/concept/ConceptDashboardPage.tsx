import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import type { Kotoba } from '@/features/kotoba/api'
import { useLanguage } from '@/features/language/useLanguage'
import { useConceptRows, useCoverage, type ConceptRow } from './hooks'
import {
  ALL,
  applyConceptFilters,
  defaultConceptFilterState,
  distinctPartOfSpeechValues,
  distinctTiers,
  distinctTopCategories,
  groupConceptsBy,
  partOfSpeechLabel,
  tierLabel,
  type ConceptFilterState,
  type ConceptGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'category', label: 'Category' },
  { value: 'tier', label: 'Tier' },
  { value: 'part_of_speech', label: 'Part of speech' },
]

function WordList({ words }: { words: Kotoba[] | undefined }) {
  if (!words || words.length === 0) return <span className="text-muted-foreground">—</span>
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

export function ConceptDashboardPage() {
  const { languages } = useLanguage()
  const { data, isLoading, isError, error, refetch } = useConceptRows()
  const [filters, setFilters] = useState<ConceptFilterState>(defaultConceptFilterState)

  const codes = useMemo(() => languages.map((l) => l.code), [languages])
  const coverage = useCoverage(data, codes)

  const columns = useMemo<ColumnConfig<ConceptRow>[]>(
    () => [
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
        key: 'category',
        header: 'Category',
        render: (row) =>
          row.category ? (
            <span className="text-sm">{row.category.name}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        sortValue: (row) => row.category?.name ?? null,
      },
      {
        key: 'tier',
        header: 'Tier',
        render: (row) =>
          row.concept.tier != null ? (
            <Badge variant="outline">{row.concept.tier}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        sortValue: (row) => row.concept.tier,
      },
      // One column per language, so a fourth language needs no change here.
      ...languages.map((lang) => ({
        key: lang.code,
        header: lang.name,
        render: (row: ConceptRow) => <WordList words={row.wordsByLanguage.get(lang.code)} />,
        sortValue: (row: ConceptRow) => row.wordsByLanguage.get(lang.code)?.[0]?.word ?? null,
      })),
    ],
    [languages],
  )

  const categoryOptions = useMemo(
    () => [
      { value: ALL, label: 'All categories' },
      ...distinctTopCategories(data).map((c) => ({ value: c.slug, label: c.name })),
    ],
    [data],
  )

  const tierOptions = useMemo(
    () => [
      { value: ALL, label: 'All tiers' },
      ...distinctTiers(data).map((t) => ({ value: t, label: tierLabel(t) })),
    ],
    [data],
  )

  const partOfSpeechOptions = useMemo(
    () => [
      { value: ALL, label: 'All parts of speech' },
      ...distinctPartOfSpeechValues(data).map((v) => ({ value: v, label: partOfSpeechLabel(v) })),
    ],
    [data],
  )

  const missingOptions = useMemo(
    () => [
      { value: ALL, label: 'Any coverage' },
      ...languages.map((l) => ({ value: l.code, label: `Missing in ${l.name}` })),
    ],
    [languages],
  )

  const fields: FilterFieldConfig[] = [
    { key: 'topCategory', label: 'Category', options: categoryOptions },
    { key: 'tier', label: 'Tier', options: tierOptions },
    { key: 'missingIn', label: 'Coverage', options: missingOptions },
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

      {/* Coverage is the study signal: which language is furthest behind. */}
      <div className="flex flex-wrap gap-2">
        {coverage.map((c) => {
          const name = languages.find((l) => l.code === c.code)?.name ?? c.code
          const percent = data.length === 0 ? 0 : Math.round((c.covered / data.length) * 100)
          return (
            <div key={c.code} className="rounded-lg border px-3 py-2">
              <div className="text-xs text-muted-foreground">{name}</div>
              <div className="text-sm">
                {c.covered} / {data.length}{' '}
                <span className="text-muted-foreground">({percent}%)</span>
              </div>
            </div>
          )
        })}
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search concept, category, or word…"
        fields={fields}
        fieldValues={{
          topCategory: filters.topCategory,
          tier: filters.tier,
          missingIn: filters.missingIn,
          partOfSpeech: filters.partOfSpeech,
        }}
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
