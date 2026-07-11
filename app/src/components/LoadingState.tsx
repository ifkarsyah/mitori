import { Skeleton } from '@/components/ui/skeleton'

export function LoadingState() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
