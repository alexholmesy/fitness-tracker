'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardClient } from './dashboard-client'
import { StatCard, ProgressBar } from '@/components/stat-card'
import { TrendChart } from '@/components/charts'
import { Scale, Flame, Footprints, Dumbbell, Moon, Droplets } from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const supabase = createClient()
  const today = format(new Date(), 'EEEE, MMMM d')

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const thirtyDaysAgo = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      const weekStart = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

      const [
        { data: profile },
        { data: latestWeight },
        { data: todayCalories },
        { data: todaySteps },
        { data: todayWater },
        { data: weekWorkouts },
        { data: weekSleep },
        { data: weights },
        { data: calories },
        { data: steps },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('weight_entries').select('weight').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
        supabase.from('calorie_entries').select('calories').eq('user_id', user.id).eq('date', todayStr).single(),
        supabase.from('step_entries').select('steps').eq('user_id', user.id).eq('date', todayStr).single(),
        supabase.from('water_entries').select('litres').eq('user_id', user.id).eq('date', todayStr).single(),
        supabase.from('workouts').select('id').eq('user_id', user.id).gte('date', weekStart),
        supabase.from('sleep_entries').select('hours_slept').eq('user_id', user.id).gte('date', weekStart),
        supabase.from('weight_entries').select('date, weight').eq('user_id', user.id).gte('date', thirtyDaysAgo).order('date', { ascending: true }),
        supabase.from('calorie_entries').select('date, calories').eq('user_id', user.id).gte('date', thirtyDaysAgo).order('date', { ascending: true }),
        supabase.from('step_entries').select('date, steps').eq('user_id', user.id).gte('date', thirtyDaysAgo).order('date', { ascending: true }),
      ])

      const avgSleep = weekSleep && weekSleep.length > 0
        ? Math.round(weekSleep.reduce((s: number, e: any) => s + e.hours_slept, 0) / weekSleep.length * 10) / 10
        : null

      setData({
        stats: {
          currentWeight: latestWeight?.weight ?? null,
          caloriesToday: todayCalories?.calories ?? null,
          stepsToday: todaySteps?.steps ?? null,
          waterToday: todayWater?.litres ?? null,
          workoutsThisWeek: weekWorkouts?.length ?? 0,
          avgSleepThisWeek: avgSleep,
          calorieTarget: profile?.daily_calorie_target ?? 2000,
          stepTarget: profile?.daily_step_target ?? 10000,
          waterTarget: profile?.water_target ?? 2.5,
          weightChangeWeek: null,
        },
        weightData: (weights ?? []).map((w: any) => ({ date: w.date, value: w.weight })),
        calorieData: (calories ?? []).map((c: any) => ({ date: c.date, value: c.calories })),
        stepData: (steps ?? []).map((s: any) => ({ date: s.date, value: s.steps })),
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4 animate-fade-in">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  const { stats, weightData, calorieData, stepData } = data

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
