import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useKotobaList } from './hooks'
import { KotobaExplorer } from './KotobaExplorer'

export function KotobaDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useKotobaList()

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Kotoba</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} words total</p>
      </div>

      <KotobaExplorer words={data ?? []} />
    </div>
  )
}
