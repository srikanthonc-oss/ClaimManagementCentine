'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Database, FileUp, ClipboardList, GitBranch, Bot, Layers, HelpCircle, PanelLeftClose, PanelLeft, Users, LogOut, Sliders } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

// Context for sidebar collapsed state
export const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}>({ collapsed: false, setCollapsed: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  React.useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(collapsed))
    }
  }, [collapsed, mounted])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function Navigation() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = React.useContext(SidebarContext)
  const currentUser = useAuthStore((state) => state.currentUser)
  const signOut = useAuthStore((state) => state.signOut)
  const router = useRouter()

  const handleSignOut = () => {
    signOut()
    router.replace('/sign-in')
  }

  const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(currentUser?.role === 'admin' ? [{ href: '/data-sources', label: 'Data Sources', icon: Database }] : []),
    ...(currentUser?.role === 'admin' ? [{ href: '/file-intake', label: 'Claims File Intake', icon: FileUp }] : []),
    { href: '/pend-processing', label: 'Claims Processing', icon: ClipboardList },
    // { href: '/cob', label: 'COB Pipeline', icon: GitBranch },
    { href: '/ai-functions', label: 'Agent Registry', icon: Bot },
    { href: '/knowledge-base', label: 'Ontology', icon: Layers },
    // { href: '/data-ontology', label: 'Data Ontology', icon: Layers },
    ...(currentUser?.role === 'admin' ? [{ href: '/routing-thresholds', label: 'Routing Thresholds', icon: Sliders }] : []),
    ...(currentUser?.role === 'admin' ? [{ href: '/user-management', label: 'User Management', icon: Users }] : []),
    { href: '/help', label: 'Help & Training', icon: HelpCircle },
  ]

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background transition-all duration-200',
      collapsed ? 'w-14' : 'w-56'
    )}>
      {/* Brand */}
      <div className={cn('flex h-14 items-center border-b border-border gap-2.5', collapsed ? 'px-2 justify-center' : 'px-4')}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 text-primary-foreground">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        {!collapsed && (
          <Link href="/" className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-tight">Agentic AI</span>
            <span className="text-xs text-muted-foreground leading-tight">Claim Management</span>
          </Link>
        )}
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
              title={collapsed ? link.label : undefined}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: User info + Theme Toggle + Collapse */}
      <div className="border-t border-border p-2 space-y-1">
        {/* User info */}
        {!collapsed && currentUser && (
          <div className="px-3 py-2 rounded-md bg-muted/50 mb-1">
            <p className="text-[10px] font-medium truncate">{currentUser.name}</p>
            <p className="text-[9px] text-muted-foreground truncate">{currentUser.email}</p>
            <p className="text-[9px] text-primary font-medium capitalize">{currentUser.role}</p>
          </div>
        )}
        {!collapsed && <ThemeToggle />}
        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title="Sign out"
          className={cn(
            'flex items-center w-full rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </button>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center w-full rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
