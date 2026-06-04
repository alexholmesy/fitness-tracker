import { getWeightEntries, getProfile } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { TrendChart } from '@/components/charts'
import { DateRangeSelector } from '@/components/date-range-selector'
import { WeightClient, WeightHistoryList } from './weight-client'
import type { DateRange } from '@/types'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function WeightPage({ searchParams }: PageProps) {
  const { range = '30d' } = await searchParams
  const dateRange = (range as DateRange) || '30d'
  const [entries, profile] = await Promise.all([getWeightEntries(dateRange), getProfile()])
  const chartData = entries.map(e => ({ date: e.date, value: e.weight }))
  const weights = entries.map(e => e.weight)
  const avg = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : null
  const min = weights.length > 0 ? Math.min(...weights) : null
  const max = weights.length > 0 ? Math.max(...weights) : null
  const latest = entries.length > 0 ? entries[entries.length - 1].weight : null
  const goalWeight = profile?.goal_weight ?? null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Weight"
        subtitle="Track your progress over time"
        action={<WeightClient entries={entries} />}
      />
      <div className="px-4">
        <DateRangeSelector value={dateRange} />
      </div>
      <div className="mx-4 stat-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground">Weight (kg)</p>
          {goalWeight && latest && (
            <span className="text-xs text-muted-foreground">
              Goal: <span className="text-primary font-semibold">{goalWeight}kg</span>
              {' '}({(latest - goalWeight).toFixed(1)} to go)
            </span>
          )}
        </div>
        <TrendChart data={chartData} color="hsl(142, 72%, 55%)" unit="kg" height={180} showGrid />
      </div>
      <div className="px-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Current', value: latest ? `${latest}kg` : '--' },
          { label: 'Average', value: avg ? `${avg.toFixed(1)}kg` : '--' },
          { label: 'Goal', value: goalWeight ? `${goalWeight}kg` : '--' },
          { label: 'Lowest', value: min ? `${min}kg` : '--' },
          { label: 'Highest', value: max ? `${max}kg` : '--' },
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
        <WeightHistoryList entries={entries} />
      </div>
    </div>
  )
}
