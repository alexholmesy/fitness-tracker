'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useWorkout } from '@/lib/workout-context'
import { Timer, ChevronUp } from 'lucide-react'

export function FloatingWorkoutBar() {
  const { activeWorkout } = useWorkout()
  const router = useRouter()
  const pathname = usePathname()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!activeWorkout) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeWorkout.startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeWorkout])

  // Don't show on the session page itself
  if (!activeWorkout || pathname === '/gym/session') return null

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}>
      <button
        onClick={() => router.push('/gym/session')}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-primary text-primary-foreground shadow-xl press-effect"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium opacity-80">Active Workout</p>
            <p className="text-sm font-bold">{activeWorkout.sessionName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums">{timeStr}</span>
          <ChevronUp className="w-4 h-4 opacity-70" />
        </div>
      </button>
    </div>
  )
}
