import { getStepEntries } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { TrendChart } from '@/components/charts'
import { DateRangeSelector } from '@/components/date-range-selector'
import { StepsClient } from './steps-client'
import type { DateRange } from '@/types'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function StepsPage({ searchParams }: PageProps) {
  const { range = '30d' } = await searchParams
  const dateRange = (range as DateRange) || '30d'
  const entries = await getStepEntries(dateRange)
  const chartData = entries.map(e => ({ date: e.date, value: e.steps }))
  const values = entries.map(e => e.steps)
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
  const max = values.length > 0 ? Math.max(...values) : null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Steps" subtitle="Daily step tracking" action={<StepsClient />} />
      <div className="px-4">
        <DateRangeSelector value={dateRange} />
      </div>
      <div className="mx-4 stat-card">
        <p className="text-xs font-medium text-muted-foreground mb-3">Daily Steps</p>
        <TrendChart data={chartData} color="hsl(217, 72%, 55%)" type="bar" height={180} />
      </div>
      <div className="px-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Average', value: avg ? avg.toLocaleString() : '--' },
          { label: 'Best Day', value: max ? max.toLocaleString() : '--' },
          { label: 'Entries', value: entries.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h2>
        {entries.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">No entries yet. Tap + to log steps.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map(entry => (
              <div key={entry.id} className="stat-card flex items-center justify-between">
                <p className="text-sm font-semibold">{entry.steps.toLocaleString()} steps</p>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
