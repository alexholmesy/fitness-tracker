import { getDailyNotes } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { NotesClient } from './notes-client'

export default async function NotesPage() {
  const notes = await getDailyNotes()

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Notes" subtitle="Daily journal entries" action={<NotesClient />} />
      <div className="px-4 space-y-3">
        {notes.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">No notes yet. Tap + to add one.</p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary">{note.date}</p>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
