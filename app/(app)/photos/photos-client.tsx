'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Camera } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

export function PhotosClient() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const date = fd.get('date') as string
    const notes = fd.get('notes') as string

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${date}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          date,
          storage_path: fileName,
          public_url: publicUrl,
          notes: notes || null,
        })

      if (dbError) throw dbError

      setOpen(false)
      setPreview(null)
      setFile(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect"
      >
        <Plus className="w-4 h-4" />
        Photo
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Upload Progress Photo">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-secondary hover:border-primary/50 transition-all press-effect overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tap to choose photo</p>
              </>
            )}
          </button>
          <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
          <Input label="Notes (optional)" name="notes" placeholder="Front pose, 12 weeks in..." />
          <SubmitButton loading={loading} label="Upload Photo" loadingLabel="Uploading..." />
        </form>
      </Modal>
    </>
  )
}
