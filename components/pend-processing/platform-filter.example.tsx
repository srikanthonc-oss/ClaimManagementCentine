'use client'

import * as React from 'react'
import { PlatformFilter } from './platform-filter'
import { useUIStore } from '@/stores/ui-store'
import { useClaimsStore } from '@/stores/claims-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Example: Basic PlatformFilter Usage
 * 
 * Demonstrates the basic usage of the PlatformFilter component
 * in a sidebar layout.
 */
export function BasicPlatformFilterExample() {
  return (
    <div className="flex gap-6 p-6">
      <aside className="w-64">
        <PlatformFilter />
      </aside>
      <main className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Claims Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select platforms from the filter to see filtered claims here.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * Example: PlatformFilter with Filtered Claims Display
 * 
 * Demonstrates how to use the PlatformFilter component with
 * real-time filtering of claims based on selected platforms.
 */
export function PlatformFilterWithClaimsExample() {
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const claims = useClaimsStore((state) => state.claims)
  const platformCounts = useClaimsStore((state) => state.getCountByPlatform())

  // Filter claims by selected platforms
  const filteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) {
      return claims
    }
    return claims.filter((claim) => selectedPlatforms.includes(claim.platform))
  }, [claims, selectedPlatforms])

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-64 space-y-4">
        <PlatformFilter />
        
        {/* Display filter summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filter Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {selectedPlatforms.length === 0 ? (
              <p className="text-muted-foreground">No filters applied</p>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">Selected Platforms:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {selectedPlatforms.map((platform) => (
                    <li key={platform}>
                      {platform} ({platformCounts[platform]} claims)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>

      <main className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>
              Filtered Claims ({filteredClaims.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClaims.length === 0 ? (
              <p className="text-muted-foreground">No claims match the selected filters.</p>
            ) : (
              <div className="space-y-2">
                {filteredClaims.slice(0, 5).map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{claim.claimNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {claim.platform} • {claim.classification}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${claim.billedAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{claim.status}</p>
                    </div>
                  </div>
                ))}
                {filteredClaims.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    ... and {filteredClaims.length - 5} more claims
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * Example: PlatformFilter with Programmatic Control
 * 
 * Demonstrates how to programmatically control the PlatformFilter
 * component using the UI store actions.
 */
export function PlatformFilterWithControlsExample() {
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const selectAllPlatforms = useUIStore((state) => state.selectAllPlatforms)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)
  const setSelectedPlatforms = useUIStore((state) => state.setSelectedPlatforms)

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-64 space-y-4">
        <PlatformFilter />

        {/* Programmatic controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={selectAllPlatforms}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={clearPlatformFilters}
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSelectedPlatforms(['Facet'])}
            >
              Facet Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSelectedPlatforms(['Amisys', 'Xcelys'])}
            >
              Amisys + Xcelys
            </Button>
          </CardContent>
        </Card>
      </aside>

      <main className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Current Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg bg-muted p-4 text-sm">
              {JSON.stringify({ selectedPlatforms }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * Example: PlatformFilter with Custom Styling
 * 
 * Demonstrates how to apply custom styling to the PlatformFilter component.
 */
export function PlatformFilterCustomStylingExample() {
  return (
    <div className="flex gap-6 p-6">
      <aside className="w-64 space-y-4">
        {/* Default styling */}
        <PlatformFilter />

        {/* Custom styling with className */}
        <PlatformFilter className="border-2 border-primary shadow-lg" />

        {/* Compact version */}
        <div className="rounded-lg border p-3">
          <h3 className="mb-3 text-sm font-semibold">Compact Filter</h3>
          <PlatformFilter className="border-0 shadow-none" />
        </div>
      </aside>

      <main className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Styling Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The PlatformFilter component can be styled using the className prop
              to match your design requirements.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * Example: Complete Pend Processing Layout
 * 
 * Demonstrates a complete Pend Processing page layout with
 * PlatformFilter in the sidebar.
 */
export function CompletePendProcessingExample() {
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)
  const claims = useClaimsStore((state) => state.claims)

  const filteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) {
      return claims
    }
    return claims.filter((claim) => selectedPlatforms.includes(claim.platform))
  }, [claims, selectedPlatforms])

  // Group claims by classification
  const groupedClaims = React.useMemo(() => {
    const groups: Record<string, typeof claims> = {}
    filteredClaims.forEach((claim) => {
      if (!groups[claim.classification]) {
        groups[claim.classification] = []
      }
      groups[claim.classification].push(claim)
    })
    return groups
  }, [filteredClaims])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pend Processing</h1>
        <p className="text-muted-foreground">
          Review and process pending claims by platform and classification
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="w-64 space-y-4">
          <PlatformFilter />

          {selectedPlatforms.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={clearPlatformFilters}
            >
              Clear Filters
            </Button>
          )}
        </aside>

        <main className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Claims Overview ({filteredClaims.length} claims)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedClaims).length === 0 ? (
                <p className="text-muted-foreground">
                  No claims match the selected filters.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedClaims).map(([classification, claimsInGroup]) => (
                    <div key={classification} className="rounded-lg border p-4">
                      <h3 className="mb-2 font-semibold">
                        {classification} ({claimsInGroup.length})
                      </h3>
                      <div className="space-y-2">
                        {claimsInGroup.slice(0, 3).map((claim) => (
                          <div
                            key={claim.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{claim.claimNumber}</span>
                            <span className="text-muted-foreground">
                              {claim.platform}
                            </span>
                          </div>
                        ))}
                        {claimsInGroup.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            ... and {claimsInGroup.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
