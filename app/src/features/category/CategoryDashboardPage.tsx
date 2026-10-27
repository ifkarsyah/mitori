import { useMemo } from 'react'
import { Link } from 'react-router'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { CoverageBar } from '@/components/CoverageBar'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useLanguage } from '@/features/language/useLanguage'
import { useCategoryList, useCategorySummaries, type CategorySummary } from './hooks'

export function CategoryDashboardPage() {
  const { languages } = useLanguage()
  const { isLoading, isError, error, refetch } = useCategoryList()
  const summaries = useCategorySummaries()

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
        key: 'meanings',
        header: 'Meanings',
        render: (row) => row.meanings,
        sortValue: (row) => row.meanings,
      },
      // Coverage per language is the point of this page: where the gaps are.
      ...languages.map((lang) => ({
        key: lang.code,
        header: lang.name,
        render: (row: CategorySummary) => (
          <CoverageBar covered={row.coveredByLanguage.get(lang.code) ?? 0} total={row.meanings} />
        ),
        sortValue: (row: CategorySummary) =>
          row.meanings === 0 ? 0 : (row.coveredByLanguage.get(lang.code) ?? 0) / row.meanings,
      })),
    ],
    [languages],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Category</h1>
        <p className="text-sm text-muted-foreground">
          {summaries.length} top-level categories of vocabulary — what a word is about, not where you
          use it (that is a scene)
        </p>
      </div>

      <GroupedTable
        groups={[{ key: 'all', label: 'All categories', rows: summaries }]}
        columns={columns}
        getRowKey={(row) => row.category.id}
        getRowHref={(row) => `/category/${row.category.slug}`}
        emptyMessage="No categories yet."
      />
    </div>
  )
}
