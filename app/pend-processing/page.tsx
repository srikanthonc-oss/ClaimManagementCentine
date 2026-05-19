'use client'

import * as React from 'react'
import { DynamicTabs } from '@/components/file-intake/dynamic-tabs'
import { ClaimsTable } from '@/components/claims-table'
import { useClaimsStore } from '@/stores/claims-store'
import { useUIStore } from '@/stores/ui-store'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Classification, Platform, Claim } from '@/types'
import { FileText } from 'lucide-react'

export default function PendProcessingPage() {
  const claims = useClaimsStore((state) => state.claims)
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const togglePlatform = useUIStore((state) => state.togglePlatform)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)

  const [activeTab, setActiveTab] = React.useState<string>('')

  // Filter claims by selected platforms
  const platformFilteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return claims
    return claims.filter((claim) => selectedPlatforms.includes(claim.platform))
  }, [claims, selectedPlatforms])

  // Get unique classifications
  const classifications = React.useMemo(() => {
    const unique = new Set<Classification>()
    platformFilteredClaims.forEach((claim) => unique.add(claim.classification))
    return Array.from(unique)
  }, [platformFilteredClaims])

  // Get counts by classification
  const classificationCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    platformFilteredClaims.forEach((claim) => {
      counts[claim.classification] = (counts[claim.classification] || 0) + 1
    })
    return counts
  }, [platformFilteredClaims])

  // Filter claims by active tab
  const filteredClaims = React.useMemo(() => {
    if (!activeTab) return platformFilteredClaims
    return platformFilteredClaims.filter((claim) => claim.classification === activeTab)
  }, [platformFilteredClaims, activeTab])

  // Reset active tab when platform filter changes and current tab is no longer valid
  React.useEffect(() => {
    if (classifications.length === 0) {
      setActiveTab('')
      return
    }
    if (!activeTab || !classifications.includes(activeTab as Classification)) {
      const sorted = [...classifications].sort((a, b) => a.localeCompare(b))
      setActiveTab(sorted[0])
    }
  }, [classifications, activeTab, selectedPlatforms])

  // Platform counts from all claims (not filtered)
  const platformCounts = React.useMemo(() => {
    const counts: Record<string, number> = { Facet: 0, Amisys: 0, Xcelys: 0 }
    claims.forEach((claim) => {
      counts[claim.platform] = (counts[claim.platform] || 0) + 1
    })
    return counts
  }, [claims])

  const platforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  // Empty state
  if (claims.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Pend Processing</h1>
          <p className="text-xs text-muted-foreground">Review and process claims by platform and classification</p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No claims data loaded</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload an XLS file in File Intake to load claims data
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pend Processing</h1>
        <p className="text-xs text-muted-foreground">
          {selectedPlatforms.length > 0
            ? `${platformFilteredClaims.length} claims · Filtered by: ${selectedPlatforms.join(', ')}`
            : 'Select a platform to view and process claims'}
        </p>
      </div>

      {/* Platform Filter - inline horizontal */}
      <div className="flex items-center gap-5 rounded-lg border bg-card px-4 py-3">
        <span className="text-xs font-semibold text-muted-foreground">Platform:</span>
        {platforms.map((platform) => {
          const isChecked = selectedPlatforms.includes(platform)
          const count = platformCounts[platform] || 0
          const checkboxId = `pend-platform-${platform.toLowerCase()}`

          return (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={checkboxId}
                checked={isChecked}
                onCheckedChange={() => togglePlatform(platform)}
              />
              <Label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-1 text-xs font-normal">
                <span>{platform}</span>
                <span className="text-muted-foreground">({count})</span>
              </Label>
            </div>
          )
        })}
        {selectedPlatforms.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearPlatformFilters} className="text-xs h-6 ml-auto">
            Clear
          </Button>
        )}
      </div>

      {/* Claims Data with Tabs - only show when platform is selected */}
      {selectedPlatforms.length > 0 && classifications.length > 0 ? (
        <DynamicTabs
          classifications={classifications}
          counts={classificationCounts}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <ClaimsTable claims={filteredClaims} />
        </DynamicTabs>
      ) : selectedPlatforms.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Select a platform to view claims</h3>
          <p className="mt-1 text-xs text-muted-foreground">Use the platform filter above to display claims</p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No claims match the selected filters</h3>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your platform filters</p>
        </div>
      )}
    </div>
  )
}
