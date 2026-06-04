import { getCardioEntries } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { DateRangeSelector } from '@/components/date-range-selector'
import { CardioClient } from './cardio-client'
import type { DateRange } from '@/types'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function CardioPage({ searchParams }: PageProps) {
  const { range = '30d' } = await searchParams
  const dateRange = (range as DateRange) || '30d'
  const entries = await getCardioEntries(dateRange)
  const totalMinutes = entries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0)
  const totalDistance = entries.reduce((s, e) => s + (e.distance_km ?? 0), 0)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Cardio" subtitle={`${entries.length} sessions`} action={<CardioClient />} />
      <div className="px-4">
        <DateRangeSelector value={dateRange} />
      </div>
      <div className="px-4 grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Sessions</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Minutes</p>
          <p className="text-xl font-bold">{totalMinutes}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Km</p>
          <p className="text-xl font-bold">{totalDistance.toFixed(1)}</p>
        </div>
      </div>
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h2>
        {entries.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">No sessions yet. Tap + to log one.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{entry.activity}</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  {entry.duration_minutes && <p>{entry.duration_minutes} min</p>}
                  {entry.distance_km && <p>{entry.distance_km} km</p>}
                  {entry.calories_burned && <p>{entry.calories_burned} kcal</p>}
                </div>
              </div>
              {entry.notes && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{entry.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
