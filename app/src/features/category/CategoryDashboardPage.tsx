import { useMemo } from 'react'
import { Link } from 'react-router'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import { CoverageBar } from '@/components/CoverageBar'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useLanguage } from '@/features/language/useLanguage'
import { cn } from '@/lib/utils'
import { useCategoryList, useCategorySummaries, type CategorySummary } from './hooks'

export function CategoryDashboardPage() {
  const { languages } = useLanguage()
  const { isLoading, isError, error, refetch } = useCategoryList()
  const summaries = useCategorySummaries()
  const rootCount = summaries.filter((s) => s.depth === 0).length

  // No sortValue on any column: the rows form a tree, and sorting them would
  // pull sub-categories away from their parent.
  const columns = useMemo<ColumnConfig<CategorySummary>[]>(
    () => [
      {
        key: 'name',
        header: 'Category',
        render: (row) => (
          <Link
            to={`/category/${row.category.slug}`}
            className={cn(
              'hover:underline',
              row.depth === 0 && 'text-lg font-semibold',
              row.depth === 1 && 'font-medium',
              row.depth > 1 && 'text-muted-foreground',
            )}
            style={{ paddingLeft: `${row.depth * 1.5}rem` }}
            onClick={(e) => e.stopPropagation()}
          >
            {row.category.name}
          </Link>
        ),
      },
      {
        key: 'meanings',
        header: 'Meanings',
        render: (row) => <span className={row.depth <= 1 ? 'font-medium' : undefined}>{row.meanings}</span>,
      },
      // Coverage per language is the point of this page: where the gaps are.
      ...languages.map((lang) => ({
        key: lang.code,
        header: lang.name,
        render: (row: CategorySummary) => (
          <CoverageBar covered={row.coveredByLanguage.get(lang.code) ?? 0} total={row.meanings} />
        ),
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
          {rootCount} broad areas of vocabulary, each split into categories — what a word is about, not where
          you use it (that is a scene)
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
