'use client'

import * as React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Classification } from '@/types'

export interface DynamicTabsProps {
  /**
   * Array of unique classification values to generate tabs from
   */
  classifications: Classification[]

  /**
   * Record mapping each classification to its claim count
   */
  counts: Record<string, number>

  /**
   * Currently active tab (classification value)
   */
  activeTab: string

  /**
   * Callback when tab is changed
   */
  onTabChange: (classification: string) => void

  /**
   * Content to render for each tab
   */
  children?: React.ReactNode

  /**
   * Optional CSS classes for styling
   */
  className?: string
}

/**
 * DynamicTabs Component
 * 
 * A controlled tabs component that dynamically generates tabs from unique classification values.
 * 
 * Features:
 * - Generates tabs from unique classification values
 * - Sorts tabs alphabetically by classification name
 * - Displays claim count in each tab label
 * - Highlights active tab with visual feedback
 * - Tab switching happens within 300ms (optimized rendering)
 * - Fully controlled component (activeTab, onTabChange props)
 * - Supports both light and dark themes
 * - Accessible with keyboard navigation and ARIA labels
 * - Built on shadcn/ui Tabs component (Radix UI primitives)
 * 
 * @param classifications - Array of unique classification values
 * @param counts - Record mapping each classification to its claim count
 * @param activeTab - Currently active tab (classification value)
 * @param onTabChange - Callback when tab is changed
 * @param children - Content to render for each tab
 * @param className - Optional CSS classes for styling
 * 
 * @example
 * ```tsx
 * <DynamicTabs
 *   classifications={['DUAL', 'COB', 'Pricing']}
 *   counts={{ 'DUAL': 45, 'COB': 23, 'Pricing': 12 }}
 *   activeTab="DUAL"
 *   onTabChange={(tab) => setActiveTab(tab)}
 * >
 *   <ClaimsTable claims={filteredClaims} />
 * </DynamicTabs>
 * ```
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 12.3**
 */
export function DynamicTabs({
  classifications,
  counts,
  activeTab,
  onTabChange,
  children,
  className,
}: DynamicTabsProps) {
  // Sort classifications alphabetically (Requirement 4.6)
  const sortedClassifications = React.useMemo(() => {
    return [...classifications].sort((a, b) => a.localeCompare(b))
  }, [classifications])

  // Memoize tab triggers to optimize rendering performance (Requirement 12.3)
  const tabTriggers = React.useMemo(() => {
    return sortedClassifications.map((classification) => {
      const count = counts[classification] || 0
      
      return (
        <TabsTrigger
          key={classification}
          value={classification}
          className={cn(
            'transition-all duration-200 text-xs',
            'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
            'hover:bg-accent hover:text-accent-foreground'
          )}
          aria-label={`${classification} tab with ${count} claim${count !== 1 ? 's' : ''}`}
        >
          <span className="flex items-center gap-1.5">
            <span className="font-medium">{classification}</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                'bg-muted text-muted-foreground',
                'data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground'
              )}
              data-state={activeTab === classification ? 'active' : 'inactive'}
            >
              {count}
            </span>
          </span>
        </TabsTrigger>
      )
    })
  }, [sortedClassifications, counts, activeTab])

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className={cn('w-full', className)}
    >
      <TabsList
        className={cn(
          'inline-flex h-auto w-full flex-wrap items-center justify-start gap-1 bg-muted p-1',
          'rounded-lg'
        )}
        aria-label="Claims classification tabs"
      >
        {tabTriggers}
      </TabsList>

      <TabsContent
        value={activeTab}
        className="mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        role="tabpanel"
        aria-label={`${activeTab} claims content`}
      >
        {children}
      </TabsContent>
    </Tabs>
  )
}
