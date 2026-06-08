'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ActiveWorkout {
  sessionId: string
  sessionName: string
  startTime: Date
}

interface WorkoutContextType {
  activeWorkout: ActiveWorkout | null
  setActiveWorkout: (w: ActiveWorkout | null) => void
}

const WorkoutContext = createContext<WorkoutContextType>({
  activeWorkout: null,
  setActiveWorkout: () => {},
})

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null)
  return (
    <WorkoutContext.Provider value={{ activeWorkout, setActiveWorkout }}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  return useContext(WorkoutContext)
}
