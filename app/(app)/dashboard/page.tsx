import { getDashboardStats, getWeightEntries, getCalorieEntries, getStepEntries } from '@/lib/data'
import { StatCard, ProgressBar } from '@/components/stat-card'
import { TrendChart } from '@/components/charts'
import { DashboardClient } from './dashboard-client'
import { Scale, Flame, Footprints, Dumbbell, Moon, Droplets } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const [stats, weights, calories, steps] = await Promise.all([
    getDashboardStats(),
    getWeightEntries('30d'),
    getCalorieEntries('30d'),
    getStepEntries('30d'),
  ])

  const weightData = weights.map(w => ({ date: w.date, value: w.weight }))
  const calorieData = calories.map(c => ({ date: c.date, value: c.calories }))
  const stepData = steps.map(s => ({ date: s.date, value: s.steps }))
  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="space-y-5 px-4 pb-6 animate-fade-in">
      <div className="pt-4">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-bold mt-0.5">Dashboard</h1>
      </div>

      <DashboardClient stats={stats} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Calories"
            value={stats.caloriesToday?.toLocaleString() ?? null}
            unit="kcal"
            icon={<Flame className="w-4 h-4 text-orange-400" />}
            iconBg="bg-orange-400/10"
            subtext={stats.caloriesToday ? `of ${stats.calorieTarget.toLocaleString()}` : 'Not logged'}
          />
          <StatCard
            label="Steps"
            value={stats.stepsToday?.toLocaleString() ?? null}
            icon={<Footprints className="w-4 h-4 text-blue-400" />}
            iconBg="bg-blue-400/10"
            subtext={stats.stepsToday ? `of ${stats.stepTarget.toLocaleString()}` : 'Not logged'}
          />
          <StatCard
            label="Water"
            value={stats.waterToday}
            unit="L"
            icon={<Droplets className="w-4 h-4 text-cyan-400" />}
            iconBg="bg-cyan-400/10"
            subtext={stats.waterToday ? `of ${stats.waterTarget}L` : 'Not logged'}
          />
          <StatCard
            label="Weight"
            value={stats.currentWeight}
            unit="kg"
            icon={<Scale className="w-4 h-4 text-primary" />}
            iconBg="bg-primary/10"
            subtext={
              stats.weightChangeWeek !== null
                ? `${stats.weightChangeWeek > 0 ? '+' : ''}${stats.weightChangeWeek.toFixed(1)}kg this week`
                : undefined
            }
            subtextColor={
              stats.weightChangeWeek !== null
                ? stats.weightChangeWeek <= 0 ? 'green' : 'red'
                : 'neutral'
            }
          />
        </div>

        {(stats.caloriesToday || stats.stepsToday || stats.waterToday) && (
          <div className="stat-card space-y-3">
            {stats.caloriesToday !== null && (
              <ProgressBar value={stats.caloriesToday} max={stats.calorieTarget} label="Calories" showPercentage />
            )}
            {stats.stepsToday !== null && (
              <ProgressBar value={stats.stepsToday} max={stats.stepTarget} label="Steps" showPercentage color="hsl(217, 72%, 55%)" />
            )}
            {stats.waterToday !== null && (
              <ProgressBar value={stats.waterToday} max={stats.waterTarget} label="Water" showPercentage color="hsl(187, 72%, 55%)" />
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">This Week</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Workouts"
            value={stats.workoutsThisWeek}
            icon={<Dumbbell className="w-4 h-4 text-violet-400" />}
            iconBg="bg-violet-400/10"
          />
          <StatCard
            label="Avg Sleep"
            value={stats.avgSleepThisWeek}
            unit="hrs"
            icon={<Moon className="w-4 h-4 text-indigo-400" />}
            iconBg="bg-indigo-400/10"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">30-Day Trends</h2>
        {weightData.length > 0 && (
          <div className="stat-card">
            <p className="text-xs font-medium text-muted-foreground mb-3">Weight (kg)</p>
            <TrendChart data={weightData} color="hsl(142, 72%, 55%)" unit="kg" />
          </div>
        )}
        {calorieData.length > 0 && (
          <div className="stat-card">
            <p className="text-xs font-medium text-muted-foreground mb-3">Calories</p>
            <TrendChart data={calorieData} color="hsl(25, 95%, 55%)" type="bar" unit="kcal" />
          </div>
        )}
        {stepData.length > 0 && (
          <div className="stat-card">
            <p className="text-xs font-medium text-muted-foreground mb-3">Steps</p>
            <TrendChart data={stepData} color="hsl(217, 72%, 55%)" type="bar" />
          </div>
        )}
        {weightData.length === 0 && calorieData.length === 0 && (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">Start logging to see trends</p>
          </div>
        )}
      </section>
    </div>
  )
}
