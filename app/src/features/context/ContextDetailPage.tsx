import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { KotobaExplorer } from '@/features/kotoba/KotobaExplorer'
import { useContextById, useKotobaForContext } from './hooks'
import { kindLabel } from './filters'

const EMPTY_CONTEXT_NAME_BY_ID = new Map<number, string>()

export function ContextDetailPage() {
  const { id } = useParams<{ id: string }>()
  const contextId = id ? Number(id) : undefined

  const { data: context, isLoading, isError, error, refetch } = useContextById(contextId)
  const { data: words, isLoading: wordsLoading } = useKotobaForContext(contextId)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!context) return <p className="py-12 text-center text-muted-foreground">Context not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/context" />} nativeButton={false} className="w-fit">
        ← Back to contexts
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{context.name}</span>
          <Badge variant={context.kind === 'concrete' ? 'outline' : 'secondary'}>
            {kindLabel(context.kind)}
          </Badge>
        </div>
        {context.Description && <p className="text-muted-foreground">{context.Description}</p>}
        <p className="text-sm text-muted-foreground">
          {words.length} word{words.length === 1 ? '' : 's'}
        </p>
      </div>

      {wordsLoading ? (
        <LoadingState />
      ) : (
        <KotobaExplorer
          words={words}
          contextNameById={EMPTY_CONTEXT_NAME_BY_ID}
          includeContextFilter={false}
          includeContextColumn={false}
        />
      )}
    </div>
  )
}
