import { Link } from 'react-router'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useQualityStats } from './hooks'
import type { AffectedRow, CompletenessStat, StructuralCheck } from './stats'

const AFFECTED_ROWS_PREVIEW_LIMIT = 20

function AffectedRowsDisclosure({ rows }: { rows: AffectedRow[] }) {
  if (rows.length === 0) return null
  const preview = rows.slice(0, AFFECTED_ROWS_PREVIEW_LIMIT)
  const remaining = rows.length - preview.length

  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
        View {rows.length} affected row{rows.length === 1 ? '' : 's'}
      </summary>
      <ul className="mt-1 ml-3 flex flex-col gap-0.5">
        {preview.map((row) => (
          <li key={row.key}>
            <Link to={row.href} className="text-xs hover:underline">
              {row.label}
            </Link>
          </li>
        ))}
        {remaining > 0 && <li className="text-xs text-muted-foreground">and {remaining} more</li>}
      </ul>
    </details>
  )
}

function CompletenessSection({ title, stats }: { title: string; stats: CompletenessStat[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      <ul className="flex flex-col gap-3">
        {stats.map((stat) => (
          <li key={stat.key} className="text-sm">
            <div className="mb-1 flex items-baseline justify-between">
              <span>{stat.label}</span>
              <span className={stat.percent < 50 ? 'text-destructive' : 'text-muted-foreground'}>
                {stat.percent.toFixed(1)}%
              </span>
            </div>
            <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${stat.percent}%` }} />
            </span>
            <AffectedRowsDisclosure rows={stat.missingRows} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function StructuralCheckRow({ check }: { check: StructuralCheck }) {
  return (
    <li className="border-t py-2.5 text-sm last:border-b">
      <div className="flex items-center gap-3">
        {check.passed ? (
          <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
        )}
        <span className="flex-1">{check.label}</span>
        <span className={check.passed ? 'text-muted-foreground' : 'font-medium text-destructive'}>
          {check.detail}
        </span>
      </div>
      {!check.passed && (
        <div className="pl-7">
          <AffectedRowsDisclosure rows={check.affectedRows} />
        </div>
      )}
    </li>
  )
}

export function QualityDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQualityStats()

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  const flaggedCount = data.checks.filter((c) => !c.passed).length

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Data quality</h1>
        <p className="text-sm text-muted-foreground">Completeness and consistency checks across the dataset</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Kotoba" value={data.kotobaTotal} />
        <StatCard label="Kanji" value={data.kanjiTotal} />
        <StatCard label="Sentences" value={data.sentencesTotal} />
        <StatCard label="Checks flagged" value={`${flaggedCount} of ${data.checks.length}`} />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <CompletenessSection title="Kotoba columns" stats={data.kotobaStats} />
        <CompletenessSection title="Kanji columns" stats={data.kanjiStats} />
        <CompletenessSection title="Sentence columns" stats={data.sentenceStats} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Structural checks</h3>
        <ul className="flex flex-col">
          {data.checks.map((check) => (
            <StructuralCheckRow key={check.key} check={check} />
          ))}
        </ul>
      </div>
    </div>
  )
}
