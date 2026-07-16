import { Link, useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useGrammarPointBySlug } from './hooks'
import { categoryLabel } from './filters'

const markdownComponents = {
  h1: () => null, // title is already shown above; avoid a duplicate heading
  h2: (props: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mt-6 mb-2 text-lg font-semibold first:mt-0" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-3 leading-relaxed" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<'li'>) => <li className="leading-relaxed" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold" {...props} />
  ),
  hr: () => <hr className="my-6 border-t" />,
  table: (props: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b px-3 py-2 text-left font-medium text-muted-foreground" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b px-3 py-2 align-top" {...props} />
  ),
  a: (props: React.ComponentPropsWithoutRef<'a'>) => (
    <a className="text-primary underline underline-offset-4" {...props} />
  ),
  code: (props: React.ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded bg-muted px-1 py-0.5 text-sm" {...props} />
  ),
}

export function GrammarDetailPage() {
  const params = useParams()
  const slug = params['*']

  const { data: point, isLoading, isError, error, refetch } = useGrammarPointBySlug(slug)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!point) return <p className="py-12 text-center text-muted-foreground">Grammar point not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" render={<Link to="/grammar" />} nativeButton={false} className="w-fit">
        ← Back to grammar
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{point.title}</span>
          <Badge variant="outline">{categoryLabel(point.category)}</Badge>
        </div>
      </div>

      <div className="max-w-3xl text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {point.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
