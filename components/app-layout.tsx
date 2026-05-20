'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Navigation, SidebarProvider, SidebarContext } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { cn } from '@/lib/utils'

export interface AppLayoutProps {
  children: React.ReactNode
}

const authPaths = ['/sign-in', '/sign-up']

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = React.useContext(SidebarContext)
  const pathname = usePathname()
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p))

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="relative min-h-screen">
      <Navigation />
      <main
        className={cn('min-h-screen transition-all duration-200', collapsed ? 'ml-14' : 'ml-56')}
        role="main"
        aria-label="Main content"
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </AuthGuard>
  )
}
