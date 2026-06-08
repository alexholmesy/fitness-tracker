'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy } from 'lucide-react'
import { format } from 'date-fns'

export default function SessionDetailPage() {
 const params = useParams()
 const router = useRouter()
 const [session, setSession] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const supabase = createClient()

 useEffect(() => {
   async function fetchSession() {
     const { data } = await supabase
       .from('workout_sessions')
       .select('*, workout_sets(*)')
       .eq('id', params.id)
       .single()
     setSession(data)
     setLoading(false)
   }
   fetchSession()
 }, [params.id])

 if (loading) return (
   <div className="flex items-center justify-center min-h-screen">
     <p className="text-muted-foreground text-sm">Loading...</p>
   </div>
 )

 if (!session) return null

 const sets = session.workout_sets ?? []
 const exercises = [...new Set(sets.map((s: any) => s.exercise_name))] as string[]
 const volume = sets.reduce((sum: number, s: any) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
 const duration = session.finished_at
   ? Math.round((new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000)
   : null

 return (
   <div className="pb-6 animate-fade-in">
     {/* Header */}
     <div className="flex items-center gap-3 px-4 pt-4 pb-2">
       <button
         onClick={() => router.push('/gym')}
         className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary press-effect"
       >
         <ArrowLeft className="w-4 h-4" />
       </button>
       <div>
         <h1 className="text-xl font-bold">{session.name}</h1>
         <p className="text-xs text-muted-foreground">
           {format(new Date(session.started_at), 'EEE, MMM d yyyy')}
           {duration && ` · ${duration} min`}
         </p>
       </div>
     </div>

     {/* Stats */}
     <div className="px-4 grid grid-cols-3 gap-3 mb-4">
       <div className="stat-card text-center">
         <p className="text-xs text-muted-foreground mb-1">Exercises</p>
         <p className="text-xl font-bold">{exercises.length}</p>
       </div>
       <div className="stat-card text-center">
         <p className="text-xs text-muted-foreground mb-1">Sets</p>
         <p className="text-xl font-bold">{sets.filter((s: any) => s.completed).length}</p>
       </div>
       <div className="stat-card text-center">
         <p className="text-xs text-muted-foreground mb-1">Volume</p>
         <p className="text-xl font-bold">{volume > 0 ? `${(volume / 1000).toFixed(1)}t` : '--'}</p>
       </div>
     </div>

     {session.notes && (
       <div className="px-4 mb-4">
         <div className="stat-card">
           <p className="text-xs text-muted-foreground mb-1">Notes</p>
           <p className="text-sm">{session.notes}</p>
         </div>
       </div>
     )}

     {/* Exercises */}
     <div className="px-4 space-y-4">
       {exercises.map(exerciseName => {
         const exerciseSets = sets
           .filter((s: any) => s.exercise_name === exerciseName)
           .sort((a: any, b: any) => a.set_index - b.set_index)

         const maxWeight = Math.max(...exerciseSets.map((s: any) => s.weight_kg ?? 0))

         return (
           <div key={exerciseName} className="stat-card space-y-3">
             <div className="flex items-center justify-between">
               <p className="font-semibold text-primary">{exerciseName}</p>
               {maxWeight > 0 && (
                 <div className="flex items-center gap-1 text-yellow-400">
                   <Trophy className="w-3.5 h-3.5" />
                   <span className="text-xs font-medium">{maxWeight}kg best</span>
                 </div>
               )}
             </div>

             {/* Set headers */}
             <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground px-1">
               <div>SET</div>
               <div className="text-center">KG</div>
               <div className="text-center">REPS</div>
               <div className="text-center">RPE</div>
             </div>

             {/* Sets */}
             {exerciseSets.map((set: any, idx: number) => (
               <div
                 key={idx}
                 className={`grid grid-cols-4 gap-2 px-1 py-1.5 rounded-lg text-sm ${
                   set.completed ? 'bg-primary/5' : 'opacity-50'
                 }`}
               >
                 <div className="text-xs font-medium text-muted-foreground">{idx + 1}</div>
                 <div className="text-center font-medium">{set.weight_kg ?? '--'}</div>
                 <div className="text-center font-medium">{set.reps ?? '--'}</div>
                 <div className="text-center text-muted-foreground">{set.rpe ?? '--'}</div>
               </div>
             ))}

             {/* Volume for this exercise */}
             {exerciseSets.length > 0 && (
               <p className="text-xs text-muted-foreground text-right">
                 Volume: {exerciseSets.reduce((sum: number, s: any) =>
                   sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0
                 ).toLocaleString()} kg
               </p>
             )}
           </div>
         )
       })}
     </div>
   </div>
 )
}
