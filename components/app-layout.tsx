'use client'

import * as React from 'react'
import { Navigation } from '@/components/navigation'
import { useUIStore } from '@/stores/ui-store'

export interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Rehydrate persisted store on client mount
  React.useEffect(() => {
    useUIStore.persist.rehydrate()
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* Left Sidebar Navigation */}
      <Navigation />

      {/* Main content area - offset by sidebar width */}
      <main
        className="ml-56 min-h-screen"
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
