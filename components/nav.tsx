'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Scale, Flame, Footprints,
  Dumbbell, BarChart3, Heart, Moon, Droplets,
  Camera, FileText, Settings
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/workouts', icon: Dumbbell, label: 'Workout' },
  { href: '/weight', icon: Scale, label: 'Weight' },
  { href: '/calories', icon: Flame, label: 'Calories' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
]

const allNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/weight', icon: Scale, label: 'Weight' },
  { href: '/calories', icon: Flame, label: 'Calories' },
  { href: '/steps', icon: Footprints, label: 'Steps' },
  { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { href: '/cardio', icon: Heart, label: 'Cardio' },
  { href: '/sleep', icon: Moon, label: 'Sleep' },
  { href: '/water', icon: Droplets, label: 'Water' },
  { href: '/photos', icon: Camera, label: 'Photos' },
  { href: '/notes', icon: FileText, label: 'Notes' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl press-effect transition-colors min-w-[56px] ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="space-y-1">
      {allNavItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all press-effect ${
              active
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
