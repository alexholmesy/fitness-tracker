'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'

interface HevyRow {
  title: string
  start_time: string
  end_time: string
  description: string
  exercise_title: string
  set_index: string
  set_type: string
  weight_kg: string
  reps: string
  rpe: string
}

function parseHevyDate(dateStr: string): string {
  // "5 Jun 2026, 11:34" -> ISO string
  try {
    const cleaned = dateStr.replace(',', '')
    const date = new Date(cleaned)
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function parseCSV(text: string): HevyRow[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  
  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    const row: any = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    return row as HevyRow
  })
}

export function HevyImport({ onImport }: { onImport: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setProgress('Reading file...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const text = await file.text()
      const rows = parseCSV(text)

      setProgress(`Parsed ${rows.length} rows...`)

      // Group rows by workout (title + start_time)
      const workoutMap = new Map<string, HevyRow[]>()
      for (const row of rows) {
        const key = `${row.title}|||${row.start_time}`
        if (!workoutMap.has(key)) workoutMap.set(key, [])
        workoutMap.get(key)!.push(row)
      }

      setProgress(`Found ${workoutMap.size} workouts. Importing...`)

      let imported = 0
      for (const [key, sets] of Array.from(workoutMap.entries())) {
        const [title, startTime] = key.split('|||')
        const firstRow = sets[0]

        // Create workout session
        const { data: session, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            name: title,
            started_at: parseHevyDate(firstRow.start_time),
            finished_at: parseHevyDate(firstRow.end_time),
            notes: firstRow.description || null,
          })
          .select()
          .single()

        if (sessionError) continue

        // Insert all sets
        const setsToInsert = sets.map((row, idx) => ({
          session_id: session.id,
          exercise_name: row.exercise_title,
          set_index: parseInt(row.set_index) || idx,
          weight_kg: row.weight_kg ? parseFloat(row.weight_kg) : null,
          reps: row.reps ? parseInt(row.reps) : null,
          rpe: row.rpe ? parseFloat(row.rpe) : null,
          set_type: row.set_type || 'normal',
          completed: true,
          sort_order: idx,
        }))

        await supabase.from('workout_sets').insert(setsToInsert)

        imported++
        if (imported % 10 === 0) {
          setProgress(`Imported ${imported}/${workoutMap.size} workouts...`)
        }
      }

      setProgress(`Done! Imported ${imported} workouts.`)
      setDone(true)
      onImport()
    } catch (err) {
      setProgress(`Error: ${err instanceof Error ? err.message : 'Import failed'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-sm font-medium press-effect"
      >
        <Upload className="w-4 h-4" />
        Import Hevy
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Import from Hevy</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              {!done ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Export your data from Hevy (Profile → Settings → Export Data) then upload the CSV here.
                  </p>
                  {!loading ? (
                    <label className="flex flex-col items-center gap-3 py-8 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-all">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Tap to select CSV file</span>
                      <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
                    </label>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">{progress}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <span className="text-4xl">✅</span>
                  <p className="text-sm font-semibold">{progress}</p>
                  <p className="text-xs text-muted-foreground">Your workout history is now in FitTrack.</p>
                  <button
                    onClick={() => { setOpen(false); setDone(false); setProgress('') }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
