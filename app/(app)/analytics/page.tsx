import { getAnalytics } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { TrendingDown, Flame, Dumbbell, Target, Footprints, Moon } from 'lucide-react'

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  const metrics = [
    {
      icon: TrendingDown,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      label: 'Weight Loss / Week',
      value: analytics.weightLossPerWeek !== null
        ? `${analytics.weightLossPerWeek > 0 ? '+' : ''}${analytics.weightLossPerWeek} kg`
        : '--',
      sub: 'Last 30 days average',
    },
    {
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      label: 'Avg Daily Calories',
      value: analytics.avgCalorieIntake !== null
        ? `${analytics.avgCalorieIntake.toLocaleString()} kcal`
        : '--',
      sub: 'Last 30 days',
    },
    {
      icon: Dumbbell,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
      label: 'Workouts / Week',
      value: analytics.workoutFrequencyPerWeek !== null
        ? `${analytics.workoutFrequencyPerWeek}x`
        : '--',
      sub: 'Last 30 days',
    },
    {
      icon: Target,
      color: 'text-primary',
      bg: 'bg-primary/10',
      label: 'Consistency Score',
      value: analytics.consistencyScore !== null
        ? `${analytics.consistencyScore}%`
        : '--',
      sub: 'Days with data logged',
    },
    {
      icon: Footprints,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      label: 'Avg Daily Steps',
      value: analytics.avgSteps !== null
        ? analytics.avgSteps.toLocaleString()
        : '--',
      sub: 'Last 30 days',
    },
    {
      icon: Moon,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      label: 'Avg Sleep',
      value: analytics.avgSleep !== null
        ? `${analytics.avgSleep} hrs`
        : '--',
      sub: 'Last 30 days',
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Your 30-day performance" />
      <div className="px-4 space-y-3">
        {metrics.map(({ icon: Icon, color, bg, label, value, sub }) => (
          <div key={label} className="stat-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold mt-0.5">{value}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
