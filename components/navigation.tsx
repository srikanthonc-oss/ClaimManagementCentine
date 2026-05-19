'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Database, FileUp, ClipboardList } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/data-sources', label: 'Data Sources', icon: Database },
  { href: '/file-intake', label: 'File Intake', icon: FileUp },
  { href: '/pend-processing', label: 'Pend Processing', icon: ClipboardList },
]

export function Navigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex h-12 items-center border-b border-border px-4">
        <Link href="/" className="text-sm font-bold text-foreground">
          Claims Management
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navLinks.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle at bottom */}
      <div className="border-t border-border p-3">
        <ThemeToggle />
      </div>
    </aside>
  )
}
