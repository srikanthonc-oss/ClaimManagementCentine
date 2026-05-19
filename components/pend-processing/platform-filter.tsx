'use client'

import * as React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useUIStore } from '@/stores/ui-store'
import { useClaimsStore } from '@/stores/claims-store'
import type { Platform } from '@/types'
import { cn } from '@/lib/utils'

export interface PlatformFilterProps {
  /**
   * Optional additional CSS classes
   */
  className?: string
}

/**
 * PlatformFilter Component
 * 
 * A multi-select filter component for filtering claims by platform (Facet, Amisys, Xcelys).
 * Displays checkboxes for each platform with claim counts and integrates with the UI state store.
 * 
 * Features:
 * - Multi-select checkboxes for Facet, Amisys, and Xcelys platforms
 * - Displays claim count for each platform
 * - Integrates with Zustand UI state store for selected platforms
 * - Supports both light and dark themes
 * - Accessible with proper ARIA labels and keyboard support
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**
 * 
 * @example
 * ```tsx
 * <PlatformFilter />
 * ```
 */
export function PlatformFilter({ className }: PlatformFilterProps) {
  // Get selected platforms and toggle function from UI store
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const togglePlatform = useUIStore((state) => state.togglePlatform)
  
  // Get platform counts from claims store
  const platformCounts = useClaimsStore((state) => state.getCountByPlatform())

  // Define all available platforms
  const platforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  /**
   * Handle checkbox change for a platform
   */
  const handlePlatformToggle = (platform: Platform) => {
    togglePlatform(platform)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex items-center gap-6 p-0">
        <span className="text-xs font-semibold text-muted-foreground">Platform:</span>
        {platforms.map((platform) => {
          const isChecked = selectedPlatforms.includes(platform)
          const count = platformCounts[platform] || 0
          const checkboxId = `platform-${platform.toLowerCase()}`

          return (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={checkboxId}
                checked={isChecked}
                onCheckedChange={() => handlePlatformToggle(platform)}
                aria-label={`Filter by ${platform} platform (${count} claims)`}
              />
              <Label
                htmlFor={checkboxId}
                className="flex cursor-pointer items-center gap-1 text-xs font-normal"
              >
                <span>{platform}</span>
                <span className="text-muted-foreground">({count})</span>
              </Label>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
