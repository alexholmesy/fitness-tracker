import { getCalorieEntries, getProfile } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { TrendChart } from '@/components/charts'
import { DateRangeSelector } from '@/components/date-range-selector'
import { CaloriesClient } from './calories-client'
import type { DateRange } from '@/types'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function CaloriesPage({ searchParams }: PageProps) {
  const { range = '30d' } = await searchParams
  const dateRange = (range as DateRange) || '30d'
  const [entries, profile] = await Promise.all([getCalorieEntries(dateRange), getProfile()])
  const chartData = entries.map(e => ({ date: e.date, value: e.calories }))
  const values = entries.map(e => e.calories)
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
  const max = values.length > 0 ? Math.max(...values) : null
  const min = values.length > 0 ? Math.min(...values) : null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Calories" subtitle="Daily intake tracking" action={<CaloriesClient />} />
      <div className="px-4">
        <DateRangeSelector value={dateRange} />
      </div>
      <div className="mx-4 stat-card">
        <p className="text-xs font-medium text-muted-foreground mb-3">Daily Calories</p>
        <TrendChart data={chartData} color="hsl(25, 95%, 55%)" type="bar" unit="kcal" height={180} />
      </div>
      <div className="px-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Average', value: avg ? avg.toLocaleString() : '--' },
          { label: 'Highest', value: max ? max.toLocaleString() : '--' },
          { label: 'Lowest', value: min ? min.toLocaleString() : '--' },
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
            <p className="text-sm text-muted-foreground">No entries yet. Tap + to log calories.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map(entry => (
              <div key={entry.id} className="stat-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{entry.calories.toLocaleString()} kcal</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
                {profile?.daily_calorie_target && (
                  <div className={`text-xs font-medium px-2 py-1 rounded-lg ${
                    entry.calories <= profile.daily_calorie_target
                      ? 'bg-primary/10 text-primary'
                      : 'bg-red-400/10 text-red-400'
                  }`}>
                    {entry.calories <= profile.daily_calorie_target ? 'On target' : 'Over'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
