import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { KotobaExplorer } from '@/features/kotoba/KotobaExplorer'
import { useContextById } from '@/features/context/hooks'
import { useContextList } from '@/features/kotoba/hooks'
import { useKotobaForSource, useSourceById } from './hooks'

export function SourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const sourceId = id ? Number(id) : undefined

  const { data: source, isLoading, isError, error, refetch } = useSourceById(sourceId)
  const { data: context } = useContextById(source?.context_id ?? undefined)
  const { data: words, isLoading: wordsLoading } = useKotobaForSource(sourceId)
  const { data: contexts } = useContextList()

  const contextNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of contexts ?? []) {
      if (c.name) map.set(c.id, c.name)
    }
    return map
  }, [contexts])

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!source) return <p className="py-12 text-center text-muted-foreground">Source not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/source" />} nativeButton={false} className="w-fit">
        ← Back to sources
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{source.name}</span>
          {context && <Badge variant="outline">{context.name}</Badge>}
        </div>
        {source.url && (
          <a
            className="text-sm text-primary underline underline-offset-4"
            href={source.url.startsWith('http') ? source.url : `https://${source.url}`}
            target="_blank"
            rel="noreferrer"
          >
            {source.url}
          </a>
        )}
        <p className="text-sm text-muted-foreground">
          {words.length} word{words.length === 1 ? '' : 's'}
        </p>
      </div>

      {wordsLoading ? (
        <LoadingState />
      ) : (
        <KotobaExplorer
          words={words}
          contextNameById={contextNameById}
          includeContextFilter={false}
          includeSourceColumn={false}
        />
      )}
    </div>
  )
}
