import { TopBar } from '@/components/top-bar'
import { BottomNav } from '@/components/nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1 pb-24 pt-14">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
