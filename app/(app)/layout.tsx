'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/top-bar'
import { BottomNav } from '@/components/nav'

export default function AppLayout({
 children,
}: {
 children: React.ReactNode
}) {
 const [loading, setLoading] = useState(true)
 const router = useRouter()
 const supabase = createClient()

 useEffect(() => {
   supabase.auth.getSession().then(({ data: { session }, error }) => {
     console.log('Session:', session, 'Error:', error)
     if (!session) {
       router.replace('/login')
     } else {
       setLoading(false)
     }
   })
 }, [])

 if (loading) {
   return (
     <div className="min-h-screen flex items-center justify-center bg-background">
       <div className="text-muted-foreground text-sm">Loading...</div>
     </div>
   )
 }

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
