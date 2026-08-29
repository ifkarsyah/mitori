import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterFieldConfig } from '@/components/FilterBar'
import { FilterBar } from '@/components/FilterBar'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useLanguage } from '@/features/language/useLanguage'
import { useCategoryList, useCategorySummaries, type CategorySummary } from './hooks'
import {
  ALL,
  applyCategoryFilters,
  defaultCategoryFilterState,
  groupCategoriesBy,
  type CategoryFilterState,
  type CategoryGroupBy,
} from './filters'

const GROUP_BY_OPTIONS = [
  { value: 'kind', label: 'Kind' },
  { value: 'none', label: 'None' },
]

const KIND_OPTIONS = [
  { value: ALL, label: 'All kinds' },
  { value: 'core', label: 'Core' },
  { value: 'situational', label: 'Situational' },
]

function CoverageBar({ covered, total }: { covered: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((covered / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm tabular-nums">
        {covered}
        <span className="text-muted-foreground">/{total}</span>
      </span>
    </div>
  )
}

export function CategoryDashboardPage() {
  const { languages } = useLanguage()
  const { isLoading, isError, error, refetch } = useCategoryList()
  const summaries = useCategorySummaries()
  const [filters, setFilters] = useState<CategoryFilterState>(defaultCategoryFilterState)

  const columns = useMemo<ColumnConfig<CategorySummary>[]>(
    () => [
      {
        key: 'name',
        header: 'Category',
        render: (row) => (
          <Link
            to={`/category/${row.category.slug}`}
            className="text-lg hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.category.name}
          </Link>
        ),
        sortValue: (row) => row.category.sort_order,
      },
      {
        key: 'children',
        header: 'Sub-categories',
        render: (row) =>
          row.children.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {row.children.map((c) => c.name).join(' · ')}
            </span>
          ),
        sortValue: (row) => row.children.length,
      },
      {
        key: 'concepts',
        header: 'Concepts',
        render: (row) => row.concepts,
        sortValue: (row) => row.concepts,
      },
      // Coverage per language is the point of this page: where the gaps are.
      ...languages.map((lang) => ({
        key: lang.code,
        header: lang.name,
        render: (row: CategorySummary) => (
          <CoverageBar covered={row.coveredByLanguage.get(lang.code) ?? 0} total={row.concepts} />
        ),
        sortValue: (row: CategorySummary) =>
          row.concepts === 0 ? 0 : (row.coveredByLanguage.get(lang.code) ?? 0) / row.concepts,
      })),
    ],
    [languages],
  )

  const fields: FilterFieldConfig[] = [{ key: 'kind', label: 'Kind', options: KIND_OPTIONS }]

  const groups = useMemo(
    () => groupCategoriesBy(applyCategoryFilters(summaries, filters), filters.groupBy),
    [summaries, filters],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Category</h1>
        <p className="text-sm text-muted-foreground">
          {summaries.length} top-level categories — core holds the things themselves, situational
          the vocabulary for a place
        </p>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search category…"
        fields={fields}
        fieldValues={{ kind: filters.kind }}
        onFieldChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        groupByOptions={GROUP_BY_OPTIONS}
        groupBy={filters.groupBy}
        onGroupByChange={(value) => setFilters((f) => ({ ...f, groupBy: value as CategoryGroupBy }))}
        onClear={() => setFilters(defaultCategoryFilterState)}
      />

      <GroupedTable
        groups={groups}
        columns={columns}
        getRowKey={(row) => row.category.id}
        getRowHref={(row) => `/category/${row.category.slug}`}
        emptyMessage="No categories match these filters."
      />
    </div>
  )
}
