import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import type { Word } from '@/features/word/api'
import { useLanguage } from '@/features/language/useLanguage'
import { categoryFilterOptions, useCategoryLookup } from '@/features/category/hooks'
import { useMeaningRows, useCoverage, type MeaningRow } from './hooks'
import {
  ALL,
  UNCLASSIFIED,
  applyMeaningFilters,
  defaultMeaningFilterState,
  distinctPartOfSpeechValues,
  distinctTiers,
  groupMeaningsBy,
  partOfSpeechLabel,
  tierLabel,
  type MeaningFilterState,
  type MeaningGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'category', label: 'Category' },
  { value: 'tier', label: 'Tier' },
  { value: 'part_of_speech', label: 'Part of speech' },
]

function WordList({ words }: { words: Word[] | undefined }) {
  if (!words || words.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {words.map((w) => (
        <Link
          key={`${w.language}-${w.id}`}
          to={`/word/${w.word}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {w.gender ? `${w.gender} ${w.word}` : w.word}
        </Link>
      ))}
    </div>
  )
}

export function MeaningDashboardPage() {
  const { languages } = useLanguage()
  const { data, isLoading, isError, error, refetch } = useMeaningRows()
  const [filters, setFilters] = useState<MeaningFilterState>(defaultMeaningFilterState)

  const codes = useMemo(() => languages.map((l) => l.code), [languages])
  const coverage = useCoverage(data, codes)

  const columns = useMemo<ColumnConfig<MeaningRow>[]>(
    () => [
      {
        key: 'gloss',
        header: 'Meaning',
        render: (row) => (
          <Link
            to={`/meaning/${row.meaning.id}`}
            className="text-lg hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.meaning.gloss}
          </Link>
        ),
        sortValue: (row) => row.meaning.gloss,
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
          row.meaning.tier != null ? (
            <Badge variant="outline">{row.meaning.tier}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        sortValue: (row) => row.meaning.tier,
      },
      // One column per language, so a fourth language needs no change here.
      ...languages.map((lang) => ({
        key: lang.code,
        header: lang.name,
        render: (row: MeaningRow) => <WordList words={row.wordsByLanguage.get(lang.code)} />,
        sortValue: (row: MeaningRow) => row.wordsByLanguage.get(lang.code)?.[0]?.word ?? null,
      })),
    ],
    [languages],
  )

  const { tree } = useCategoryLookup()
  const categoryOptions = useMemo(
    () => [
      { value: ALL, label: 'All categories' },
      ...categoryFilterOptions(
        tree,
        data.map((r) => r.path),
      ),
      ...(data.some((r) => r.path.length === 0) ? [{ value: UNCLASSIFIED, label: 'Outside the syllabus' }] : []),
    ],
    [data, tree],
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
    { key: 'category', label: 'Category', options: categoryOptions },
    { key: 'tier', label: 'Tier', options: tierOptions },
    { key: 'missingIn', label: 'Coverage', options: missingOptions },
    { key: 'partOfSpeech', label: 'Part of speech', options: partOfSpeechOptions },
  ]

  const groups = useMemo(
    () => groupMeaningsBy(applyMeaningFilters(data, filters), filters.groupBy),
    [data, filters],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Meaning</h1>
        <p className="text-sm text-muted-foreground">
          {data.length} meanings — one shared meaning, realized once per language
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
        searchPlaceholder="Search meaning, category, or word…"
        fields={fields}
        fieldValues={{
          category: filters.category,
          tier: filters.tier,
          missingIn: filters.missingIn,
          partOfSpeech: filters.partOfSpeech,
        }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as MeaningGroupBy }))}
        onClear={() => setFilters(defaultMeaningFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.meaning.id}
        getRowHref={(row) => `/meaning/${row.meaning.id}`}
        emptyMessage="No meanings match these filters."
      />
    </div>
  )
}
