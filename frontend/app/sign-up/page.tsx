'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const signUp = useAuthStore((state) => state.signUp)
  const currentUser = useAuthStore((state) => state.currentUser)

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
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

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const result = signUp(email.trim(), name.trim(), password)
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Sign up failed')
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
          <h1 className="text-xl font-bold">Create Account</h1>
          <p className="text-xs text-muted-foreground mt-1">Sign up for Agentic AI Claim Management</p>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
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
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-xs"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                  <p className="text-[10px] text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-9 text-xs" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-[10px] text-muted-foreground">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="rounded-lg border border-dashed p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              New accounts start as <strong>Viewer</strong> with no platform access. An admin must assign your role and platform permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
