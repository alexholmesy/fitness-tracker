'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SidebarNav } from '@/components/nav'

export function TopBar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-end justify-between px-4 pb-3 bg-background/95 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-sm">💪</span>
          </div>
          <span className="font-bold text-sm">FitTrack</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors press-effect mb-0.5"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-card border-l border-border flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          className="flex items-end justify-between px-4 pb-3 border-b border-border"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <span className="font-bold text-sm">FitTrack</span>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav />
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
