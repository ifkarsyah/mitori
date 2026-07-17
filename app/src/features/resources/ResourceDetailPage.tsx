import { Link, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useContextById } from '@/features/context/hooks'
import { categoryLabel } from './filters'
import { useResourceById, useResourceChannelById } from './hooks'

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const resourceId = id ? Number(id) : undefined

  const { data: resource, isLoading, isError, error, refetch } = useResourceById(resourceId)
  const { data: channel } = useResourceChannelById(resource?.channel_id ?? undefined)
  const { data: context } = useContextById(resource?.context_id ?? undefined)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!resource) return <p className="py-12 text-center text-muted-foreground">Resource not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/resources" />} nativeButton={false} className="w-fit">
        ← Back to resources
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{resource.title}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {resource.category && <Badge variant="outline">{categoryLabel(resource.category)}</Badge>}
          {context && <Badge variant="outline">{context.name}</Badge>}
        </div>
        {channel && (
          <Link
            to={`/resources/channel/${channel.slug}`}
            className="w-fit text-sm text-muted-foreground hover:underline"
          >
            {channel.name}
          </Link>
        )}
      </div>

      <a
        className="w-fit text-sm text-primary underline underline-offset-4"
        href={resource.url}
        target="_blank"
        rel="noreferrer"
      >
        Watch on {channel?.platform === 'tiktok' ? 'TikTok' : 'YouTube'} →
      </a>
    </div>
  )
}
