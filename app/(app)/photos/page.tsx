'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui-kit'
import { PhotosClient } from './photos-client'

export default function PhotosPage() {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('progress_photos').select('*').eq('user_id', user.id).order('date', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Progress Photos" subtitle={`${photos.length} photos`} action={<PhotosClient onSave={fetchData} />} />
      <div className="px-4">
        {loading ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">Loading...</p></div>
        ) : photos.length === 0 ? (
          <div className="stat-card text-center py-12"><p className="text-sm text-muted-foreground">No photos yet. Tap + to upload your first progress photo.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="stat-card p-0 overflow-hidden rounded-xl">
                {photo.public_url ? (
                  <img src={photo.public_url} alt={`Progress photo ${photo.date}`} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="aspect-square bg-secondary flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No preview</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold">{photo.date}</p>
                  {photo.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{photo.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
