import { getSleepEntries } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { TrendChart } from '@/components/charts'
import { DateRangeSelector } from '@/components/date-range-selector'
import { SleepClient } from './sleep-client'
import type { DateRange } from '@/types'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function SleepPage({ searchParams }: PageProps) {
  const { range = '30d' } = await searchParams
  const dateRange = (range as DateRange) || '30d'
  const entries = await getSleepEntries(dateRange)
  const chartData = entries.map(e => ({ date: e.date, value: e.hours_slept }))
  const values = entries.map(e => e.hours_slept)
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Sleep" subtitle="Track your rest" action={<SleepClient />} />
      <div className="px-4">
        <DateRangeSelector value={dateRange} />
      </div>
      <div className="mx-4 stat-card">
        <p className="text-xs font-medium text-muted-foreground mb-3">Hours Slept</p>
        <TrendChart data={chartData} color="hsl(243, 75%, 65%)" height={180} />
      </div>
      <div className="px-4 grid grid-cols-2 gap-3">
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Average</p>
          <p className="text-xl font-bold">{avg ? `${avg}h` : '--'}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Entries</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
      </div>
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h2>
        {entries.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">No entries yet. Tap + to log sleep.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map(entry => (
              <div key={entry.id} className="stat-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{entry.hours_slept} hours</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground text-right max-w-[50%]">{entry.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
