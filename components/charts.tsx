'use client'

import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface ChartProps {
  data: { date: string; value: number }[]
  color?: string
  type?: 'area' | 'line' | 'bar'
  unit?: string
  height?: number
  showGrid?: boolean
  autoScale?: boolean
  decimals?: number
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">
          {label && format(parseISO(label), 'MMM d')}
        </p>
        <p className="text-sm font-bold text-foreground">
          {Number(payload[0].value).toFixed(1)}{unit ? ` ${unit}` : ''}
        </p>
      </div>
    )
  }
  return null
}

export function TrendChart({
  data,
  color = 'hsl(142, 72%, 55%)',
  type = 'area',
  unit,
  height = 160,
  showGrid = false,
  autoScale = true,
  decimals = 1,
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-muted-foreground text-sm">
        No data yet
      </div>
    )
  }

  const formatXAxis = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'MMM d') } catch { return dateStr }
  }

  const formatYAxis = (value: number) => {
    return Number(value).toFixed(decimals)
  }

  const values = data.map(d => d.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const range = dataMax - dataMin
  const padding = range * 0.3 || dataMax * 0.05
  const yDomain = autoScale && type !== 'bar'
    ? [
        parseFloat((dataMin - padding).toFixed(1)),
        parseFloat((dataMax + padding).toFixed(1))
      ]
    : ['auto', 'auto']

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
  const commonProps = { data, margin: { top: 4, right: 8, left: -8, bottom: 0 } }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart {...commonProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={v => Math.round(v).toString()} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart {...commonProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={yDomain as any} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={yDomain as any} />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
