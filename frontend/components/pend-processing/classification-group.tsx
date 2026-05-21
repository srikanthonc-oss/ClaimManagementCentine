'use client'

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ClaimsTable } from '@/components/claims-table'
import { cn } from '@/lib/utils'
import type { Claim, Platform } from '@/types'

interface ClassificationGroupProps {
  classification: string
  claims: Claim[]
  expanded: boolean
  onToggle: () => void
  selectedPlatforms?: Platform[]
  className?: string
}

/**
 * ClassificationGroup Component
 * 
 * A collapsible accordion component that groups claims by classification.
 * Displays the classification name and claim count in the header, and shows
 * a ClaimsTable with filtered claims when expanded.
 * 
 * Features:
 * - Collapsible accordion interface with expand/collapse toggle
 * - Classification name and claim count display in header
 * - Platform filtering applied to claims within the group
 * - Integrated ClaimsTable for displaying filtered claims
 * - Controlled component (expanded state managed by parent)
 * - Dark theme support
 * 
 * @param classification - The classification name for this group
 * @param claims - Array of all claims in this classification
 * @param expanded - Whether the group is currently expanded
 * @param onToggle - Callback function when the group is toggled
 * @param selectedPlatforms - Optional array of selected platforms for filtering
 * @param className - Optional CSS classes for styling
 * 
 * @example
 * ```tsx
 * <ClassificationGroup
 *   classification="DUAL"
 *   claims={dualClaims}
 *   expanded={expandedGroups.includes('DUAL')}
 *   onToggle={() => handleToggle('DUAL')}
 *   selectedPlatforms={['Facet', 'Amisys']}
 * />
 * ```
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
 */
export function ClassificationGroup({
  classification,
  claims,
  expanded,
  onToggle,
  selectedPlatforms,
  className,
}: ClassificationGroupProps) {
  // Filter claims by selected platforms if any platforms are selected
  const filteredClaims = React.useMemo(() => {
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return claims
    }
    return claims.filter((claim) => selectedPlatforms.includes(claim.platform))
  }, [claims, selectedPlatforms])

  // Get the count of filtered claims
  const claimCount = filteredClaims.length

  return (
    <Accordion
      type="single"
      collapsible
      value={expanded ? classification : ''}
      onValueChange={(value) => {
        // Only toggle if the value changed
        if ((value === classification && !expanded) || (value === '' && expanded)) {
          onToggle()
        }
      }}
      className={cn('w-full', className)}
    >
      <AccordionItem value={classification} className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{classification}</h3>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {claimCount} {claimCount === 1 ? 'claim' : 'claims'}
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-1">
          {claimCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>No claims match the selected platform filters</p>
            </div>
          ) : (
            <ClaimsTable claims={filteredClaims} />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
