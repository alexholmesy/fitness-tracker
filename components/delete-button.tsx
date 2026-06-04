'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setLoading(true)
    try {
      await onDelete()
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all press-effect ${
        confirming
          ? 'bg-destructive/20 text-destructive border border-destructive/30'
          : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
      }`}
    >
      <Trash2 className="w-3 h-3" />
      {loading ? '...' : confirming ? 'Confirm?' : ''}
    </button>
  )
}
