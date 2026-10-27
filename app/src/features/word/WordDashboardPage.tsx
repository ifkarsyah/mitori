import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useWordList } from './hooks'
import { WordExplorer } from './WordExplorer'

export function WordDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useWordList()

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Word</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} words total</p>
      </div>

      <WordExplorer words={data ?? []} />
    </div>
  )
}
