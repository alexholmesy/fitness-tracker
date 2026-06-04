'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { DateRange } from '@/types'

const ranges: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
]

export function DateRangeSelector({ value }: { value: DateRange }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setRange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
      {ranges.map(r => (
        <button
          key={r.value}
          onClick={() => setRange(r.value)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all press-effect ${
            value === r.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
