'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui-kit'
import { TrendingDown, Flame, Dumbbell, Target, Footprints, Moon } from 'lucide-react'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [
        { data: weights },
        { data: calories },
        { data: workouts },
        { data: steps },
        { data: sleep },
      ] = await Promise.all([
        supabase.from('weight_entries').select('date, weight').eq('user_id', user.id).gte('date', thirtyDaysAgo).order('date', { ascending: true }),
        supabase.from('calorie_entries').select('calories').eq('user_id', user.id).gte('date', thirtyDaysAgo),
        supabase.from('workouts').select('date').eq('user_id', user.id).gte('date', thirtyDaysAgo),
        supabase.from('step_entries').select('steps').eq('user_id', user.id).gte('date', thirtyDaysAgo),
        supabase.from('sleep_entries').select('hours_slept').eq('user_id', user.id).gte('date', thirtyDaysAgo),
      ])

      let weightLossPerWeek = null
      if (weights && weights.length >= 2) {
        const totalLoss = weights[0].weight - weights[weights.length - 1].weight
        weightLossPerWeek = Math.round((totalLoss / (30 / 7)) * 100) / 100
      }

      setAnalytics({
        weightLossPerWeek,
        avgCalorieIntake: calories && calories.length > 0 ? Math.round(calories.reduce((s: number, c: any) => s + c.calories, 0) / calories.length) : null,
        workoutFrequencyPerWeek: workouts ? Math.round((workouts.length / 30 * 7) * 10) / 10 : null,
        avgSteps: steps && steps.length > 0 ? Math.round(steps.reduce((s: number, e: any) => s + e.steps, 0) / steps.length) : null,
        avgSleep: sleep && sleep.length > 0 ? Math.round(sleep.reduce((s: number, e: any) => s + e.hours_slept, 0) / sleep.length * 10) / 10 : null,
        consistencyScore: weights && calories ? Math.round(((weights.length + (calories?.length ?? 0)) / 2 / 30) * 100) : null,
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  const metrics = [
    { icon: TrendingDown, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Weight Loss / Week', value: analytics?.weightLossPerWeek !== null && analytics?.weightLossPerWeek !== undefined ? `${analytics.weightLossPerWeek > 0 ? '+' : ''}${analytics.weightLossPerWeek} kg` : '--', sub: 'Last 30 days' },
    { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Avg Daily Calories', value: analytics?.avgCalorieIntake ? `${analytics.avgCalorieIntake.toLocaleString()} kcal` : '--', sub: 'Last 30 days' },
    { icon: Dumbbell, color: 'text-violet-400', bg: 'bg-violet-400/10', label: 'Workouts / Week', value: analytics?.workoutFrequencyPerWeek ? `${analytics.workoutFrequencyPerWeek}x` : '--', sub: 'Last 30 days' },
    { icon: Target, color: 'text-primary', bg: 'bg-primary/10', label: 'Consistency Score', value: analytics?.consistencyScore ? `${analytics.consistencyScore}%` : '--', sub: 'Days with data logged' },
    { icon: Footprints, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Avg Daily Steps', value: analytics?.avgSteps ? analytics.avgSteps.toLocaleString() : '--', sub: 'Last 30 days' },
    { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10', label: 'Avg Sleep', value: analytics?.avgSleep ? `${analytics.avgSleep} hrs` : '--', sub: 'Last 30 days' },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Your 30-day performance" />
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">Loading...</p></div>
        ) : metrics.map(({ icon: Icon, color, bg, label, value, sub }) => (
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
