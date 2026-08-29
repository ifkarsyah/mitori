import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import type { ColumnConfig } from '@/components/GroupedTable'
import { GroupedTable } from '@/components/GroupedTable'
import type { Kotoba } from '@/features/kotoba/api'
import { useLanguage } from '@/features/language/useLanguage'
import { useConceptRows, type ConceptRow } from '@/features/concept/hooks'
import { useCategoryList } from './hooks'

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

export function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { languages } = useLanguage()
  const { data: categories, isLoading, isError, error, refetch } = useCategoryList()
  const { data: conceptRows } = useConceptRows()

  const category = categories?.find((c) => c.slug === slug)
  const descendantIds = useMemo(() => {
    if (!category) return new Set<number>()
    const ids = new Set<number>([category.id])
    for (const c of categories ?? []) if (c.parent_id === category.id) ids.add(c.id)
    return ids
  }, [categories, category])

  const rows = useMemo(
    () => conceptRows.filter((r) => r.concept.category_id != null && descendantIds.has(r.concept.category_id)),
    [conceptRows, descendantIds],
  )

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
        key: 'sub',
        header: 'Sub-category',
        render: (row) =>
          row.category && row.category.id !== category?.id ? (
            row.category.name
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
      ...languages.map((lang) => ({
        key: lang.code,
        header: lang.name,
        render: (r: ConceptRow) => <WordList words={r.wordsByLanguage.get(lang.code)} />,
        sortValue: (r: ConceptRow) => r.wordsByLanguage.get(lang.code)?.[0]?.word ?? null,
      })),
    ],
    [languages, category],
  )

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!category) {
    return <p className="py-12 text-center text-muted-foreground">Category not found.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/category" />} nativeButton={false} className="w-fit">
        ← Back to categories
      </Button>

      <div className="flex flex-col gap-2">
        <span className="text-4xl">{category.name}</span>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{category.kind === 'core' ? 'Core' : 'Situational'}</Badge>
          <Badge variant="secondary">{rows.length} concepts</Badge>
          {languages.map((lang) => {
            const covered = rows.filter((r) => (r.wordsByLanguage.get(lang.code)?.length ?? 0) > 0).length
            return (
              <Badge key={lang.code} variant="outline">
                {lang.name} {covered}/{rows.length}
              </Badge>
            )
          })}
        </div>
      </div>

      <GroupedTable
        groups={[{ key: 'all', label: category.name, rows }]}
        columns={columns}
        getRowKey={(row) => row.concept.id}
        getRowHref={(row) => `/concept/${row.concept.id}`}
        emptyMessage="No concepts in this category yet."
      />
    </div>
  )
}
