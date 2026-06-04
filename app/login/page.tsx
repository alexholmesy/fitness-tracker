'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const supabase = createClient()

 const handleLogin = async (e: React.FormEvent) => {
   e.preventDefault()
   setLoading(true)
   setError(null)

   const { data, error } = await supabase.auth.signInWithPassword({ email, password })

   if (error) {
     setError(error.message)
     setLoading(false)
   } else if (data?.user && !data.user.email_confirmed_at) {
     setError('Please verify your email first before signing in.')
     setLoading(false)
   } else {
     window.location.href = '/dashboard'
   }
 }

 return (
   <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
     <div className="w-full max-w-sm space-y-8">
       <div className="flex flex-col items-center space-y-3">
         <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
           <span className="text-2xl">💪</span>
         </div>
         <div className="text-center">
           <h1 className="text-2xl font-bold">FitTrack</h1>
           <p className="text-sm text-muted-foreground mt-1">Your personal fitness dashboard</p>
         </div>
       </div>
       <form onSubmit={handleLogin} className="space-y-4">
         {error && (
           <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
             {error}
           </div>
         )}
         <div className="space-y-2">
           <label className="text-sm font-medium">Email</label>
           <input
             type="email"
             value={email}
             onChange={e => setEmail(e.target.value)}
             required
             className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
             placeholder="you@example.com"
           />
         </div>
         <div className="space-y-2">
           <label className="text-sm font-medium">Password</label>
           <input
             type="password"
             value={password}
             onChange={e => setPassword(e.target.value)}
             required
             className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
             placeholder="••••••••"
           />
         </div>
         <button
           type="submit"
           disabled={loading}
           className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm press-effect disabled:opacity-50 transition-all"
         >
           {loading ? 'Signing in...' : 'Sign In'}
         </button>
       </form>
       <p className="text-center text-sm text-muted-foreground">
         Don&apos;t have an account?{' '}
         <Link href="/signup" className="text-primary font-medium hover:underline">
           Sign up
         </Link>
       </p>
     </div>
   </div>
 )
}
