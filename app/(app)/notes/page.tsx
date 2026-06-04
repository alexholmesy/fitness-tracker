'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui-kit'
import { NotesClient } from './notes-client'

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('daily_notes').select('*').eq('user_id', user.id).order('date', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Notes" subtitle="Daily journal entries" action={<NotesClient onSave={fetchData} />} />
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">Loading...</p></div>
        ) : notes.length === 0 ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">No notes yet. Tap + to add one.</p></div>
        ) : notes.map(note => (
          <div key={note.id} className="stat-card">
            <p className="text-xs font-semibold text-primary mb-2">{note.date}</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
