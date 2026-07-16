import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useGrammarPointList } from './hooks'
import { applyGrammarSearch, groupGrammarByCategory } from './filters'

export function GrammarDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useGrammarPointList()
  const [search, setSearch] = useState('')

  const groups = useMemo(() => {
    const filtered = applyGrammarSearch(data ?? [], search)
    return groupGrammarByCategory(filtered)
  }, [data, search])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Grammar</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} grammar points</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="grammar-search">Search</Label>
        <Input
          id="grammar-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or content…"
          className="w-64"
        />
      </div>

      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No grammar points match this search.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {group.label} <span className="text-xs text-muted-foreground/70">({group.rows.length})</span>
              </h2>
              <ul className="flex flex-col divide-y">
                {group.rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      to={`/grammar/${row.slug}`}
                      className="block py-2 hover:underline"
                    >
                      {row.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
