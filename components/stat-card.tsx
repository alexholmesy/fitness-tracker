interface StatCardProps {
  label: string
  value: string | number | null
  unit?: string
  subtext?: string
  subtextColor?: 'green' | 'red' | 'neutral'
  icon: React.ReactNode
  iconBg?: string
}

export function StatCard({
  label, value, unit, subtext, subtextColor = 'neutral', icon, iconBg = 'bg-primary/10'
}: StatCardProps) {
  const subtextColors = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    neutral: 'text-muted-foreground',
  }

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} border border-white/5 flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        {subtext && (
          <span className={`text-xs font-medium ${subtextColors[subtextColor]}`}>
            {subtext}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums">
            {value !== null && value !== undefined ? value : '--'}
          </span>
          {unit && value !== null && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProgressBar({ value, max, label, showPercentage, color }: {
  value: number; max: number; label?: string; showPercentage?: boolean; color?: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="space-y-1">
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: color || undefined }}
        />
      </div>
    </div>
  )
}
