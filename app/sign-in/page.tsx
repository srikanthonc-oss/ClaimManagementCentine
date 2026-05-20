'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const signIn = useAuthStore((state) => state.signIn)
  const currentUser = useAuthStore((state) => state.currentUser)

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  // Redirect if already signed in
  React.useEffect(() => {
    if (currentUser) {
      router.push('/dashboard')
    }
  }, [currentUser, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    // Simulate network delay
    setTimeout(() => {
      const result = signIn(email.trim(), password)
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Sign in failed')
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-foreground">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold">Agentic AI Claim Management</h1>
          <p className="text-xs text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin@nttdata.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                  <p className="text-[10px] text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-9 text-xs" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center">
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials hint */}
        <div className="rounded-lg border border-dashed p-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            Demo admin: <span className="font-mono">admin@nttdata.com</span> / <span className="font-mono">admin123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
