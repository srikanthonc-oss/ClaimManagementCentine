'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, type UserRole } from '@/stores/auth-store'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const publicPaths = ['/sign-in', '/sign-up']

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [hydrated, setHydrated] = React.useState(false)

  // Wait for Zustand to hydrate from localStorage
  React.useEffect(() => {
    setHydrated(true)
  }, [])

  // Public pages — always render
  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }

  // Wait for hydration before making auth decisions
  if (!hydrated) {
    return null
  }

  // Not signed in — redirect to sign-in
  if (!currentUser) {
    if (typeof window !== 'undefined') {
      router.replace('/sign-in')
    }
    return null
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm font-semibold">Access Denied</p>
          <p className="text-xs text-muted-foreground mt-1">You don&apos;t have permission to view this page</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
