'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, type UserRole } from '@/stores/auth-store'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

// Pages that don't require authentication
const publicPaths = ['/sign-in', '/sign-up']

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [checked, setChecked] = React.useState(false)

  const isPublicPage = publicPaths.some((p) => pathname.startsWith(p))

  React.useEffect(() => {
    if (isPublicPage) {
      setChecked(true)
      return
    }
    if (!currentUser) {
      router.push('/sign-in')
    } else {
      setChecked(true)
    }
  }, [currentUser, router, isPublicPage])

  // Public pages render immediately without auth
  if (isPublicPage) {
    return <>{children}</>
  }

  if (!checked || !currentUser) {
    return null
  }

  // Check role access if specified
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
