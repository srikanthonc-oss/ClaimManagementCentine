'use client'

import * as React from 'react'
import { ClassificationGroup } from './classification-group'
import { Button } from '@/components/ui/button'
import type { Claim, Platform, Classification } from '@/types'

// Mock data generator
const createMockClaim = (
  id: string,
  classification: Classification,
  platform: Platform
): Claim => ({
  id,
  claimNumber: `CLM-${id.padStart(6, '0')}`,
  classification,
  platform,
  providerName: `Provider ${id}`,
  billedAmount: Math.floor(Math.random() * 50000) + 1000,
  status: Math.random() > 0.5 ? 'Pending' : 'In Review',
  confidence: Math.floor(Math.random() * 40) + 60,
  daysAged: Math.floor(Math.random() * 90),
  state: ['CA', 'NY', 'TX', 'FL', 'IL'][Math.floor(Math.random() * 5)],
  createdAt: new Date(),
  updatedAt: new Date(),
})

// Generate mock claims for different classifications
const generateMockClaims = (): Record<Classification, Claim[]> => {
  const classifications: Classification[] = [
    'DUAL',
    'Duplicate',
    'COB',
    'Pricing',
    'Auth',
    'Corrected Claims',
    'High Dollar',
    'Other Pend',
  ]

  const platforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  return classifications.reduce(
    (acc, classification) => {
      const claimCount = Math.floor(Math.random() * 15) + 5
      acc[classification] = Array.from({ length: claimCount }, (_, i) => {
        const platform = platforms[Math.floor(Math.random() * platforms.length)]
        return createMockClaim(`${classification}-${i + 1}`, classification, platform)
      })
      return acc
    },
    {} as Record<Classification, Claim[]>
  )
}

/**
 * Example 1: Single Classification Group
 * 
 * Basic usage with a single classification group
 */
export function SingleGroupExample() {
  const [expanded, setExpanded] = React.useState(false)
  const mockClaims = React.useMemo(() => generateMockClaims(), [])

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Single Classification Group</h2>
      <ClassificationGroup
        classification="DUAL"
        claims={mockClaims.DUAL}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
    </div>
  )
}

/**
 * Example 2: Multiple Classification Groups
 * 
 * Multiple groups with independent expand/collapse state
 */
export function MultipleGroupsExample() {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])
  const mockClaims = React.useMemo(() => generateMockClaims(), [])

  const handleToggle = (classification: string) => {
    setExpandedGroups((prev) =>
      prev.includes(classification)
        ? prev.filter((c) => c !== classification)
        : [...prev, classification]
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Multiple Classification Groups</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() =>
              setExpandedGroups(Object.keys(mockClaims) as Classification[])
            }
          >
            Expand All
          </Button>
          <Button variant="outline" onClick={() => setExpandedGroups([])}>
            Collapse All
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {(Object.entries(mockClaims) as [Classification, Claim[]][]).map(
          ([classification, claims]) => (
            <ClassificationGroup
              key={classification}
              classification={classification}
              claims={claims}
              expanded={expandedGroups.includes(classification)}
              onToggle={() => handleToggle(classification)}
            />
          )
        )}
      </div>
    </div>
  )
}

/**
 * Example 3: With Platform Filtering
 * 
 * Groups with platform filtering applied
 */
export function WithPlatformFilterExample() {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(['DUAL'])
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([
    'Facet',
    'Amisys',
  ])
  const mockClaims = React.useMemo(() => generateMockClaims(), [])

  const handleToggle = (classification: string) => {
    setExpandedGroups((prev) =>
      prev.includes(classification)
        ? prev.filter((c) => c !== classification)
        : [...prev, classification]
    )
  }

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">With Platform Filtering</h2>

      {/* Platform Filter Controls */}
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <span className="font-medium">Platforms:</span>
        {(['Facet', 'Amisys', 'Xcelys'] as Platform[]).map((platform) => (
          <label key={platform} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform)}
              onChange={() => togglePlatform(platform)}
              className="h-4 w-4"
            />
            <span>{platform}</span>
          </label>
        ))}
      </div>

      {/* Classification Groups */}
      <div className="space-y-4">
        {(Object.entries(mockClaims) as [Classification, Claim[]][])
          .slice(0, 4)
          .map(([classification, claims]) => (
            <ClassificationGroup
              key={classification}
              classification={classification}
              claims={claims}
              expanded={expandedGroups.includes(classification)}
              onToggle={() => handleToggle(classification)}
              selectedPlatforms={selectedPlatforms}
            />
          ))}
      </div>
    </div>
  )
}

/**
 * Example 4: Empty State
 * 
 * Demonstrates empty state when no claims match filters
 */
export function EmptyStateExample() {
  const [expanded, setExpanded] = React.useState(true)
  const mockClaims = React.useMemo(() => generateMockClaims(), [])

  // Filter to only Facet claims
  const facetClaims = mockClaims.DUAL.filter((claim) => claim.platform === 'Facet')

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Empty State Example</h2>
      <p className="text-muted-foreground">
        This group has claims, but they&apos;re filtered out by the platform selection
      </p>
      <ClassificationGroup
        classification="DUAL"
        claims={facetClaims}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        selectedPlatforms={['Amisys', 'Xcelys']}
      />
    </div>
  )
}

/**
 * Example 5: Sorted by Claim Count
 * 
 * Groups sorted by claim count (descending)
 */
export function SortedByCountExample() {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])
  const mockClaims = React.useMemo(() => generateMockClaims(), [])

  const handleToggle = (classification: string) => {
    setExpandedGroups((prev) =>
      prev.includes(classification)
        ? prev.filter((c) => c !== classification)
        : [...prev, classification]
    )
  }

  // Sort classifications by claim count
  const sortedClassifications = React.useMemo(() => {
    return (Object.entries(mockClaims) as [Classification, Claim[]][]).sort(
      ([, claimsA], [, claimsB]) => claimsB.length - claimsA.length
    )
  }, [mockClaims])

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Sorted by Claim Count</h2>
      <p className="text-muted-foreground">
        Classifications ordered by number of claims (highest first)
      </p>
      <div className="space-y-4">
        {sortedClassifications.map(([classification, claims]) => (
          <ClassificationGroup
            key={classification}
            classification={classification}
            claims={claims}
            expanded={expandedGroups.includes(classification)}
            onToggle={() => handleToggle(classification)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Example 6: Custom Styling
 * 
 * Groups with custom styling applied
 */
export function CustomStylingExample() {
  const [expanded, setExpanded] = React.useState(false)
  const mockClaims = React.useMemo(() => generateMockClaims(), [])

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Custom Styling</h2>
      <ClassificationGroup
        classification="High Dollar"
        claims={mockClaims['High Dollar']}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="shadow-lg border-2 border-primary/20"
      />
    </div>
  )
}

/**
 * Complete Example: Full Pend Processing Layout
 * 
 * Demonstrates how ClassificationGroup integrates into a complete page
 */
export function CompletePendProcessingExample() {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([])
  const mockClaims = React.useMemo(() => generateMockClaims(), [])

  const handleToggle = (classification: string) => {
    setExpandedGroups((prev) =>
      prev.includes(classification)
        ? prev.filter((c) => c !== classification)
        : [...prev, classification]
    )
  }

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  // Calculate total filtered claims
  const totalFilteredClaims = React.useMemo(() => {
    return Object.values(mockClaims).reduce((total, claims) => {
      const filtered =
        selectedPlatforms.length === 0
          ? claims
          : claims.filter((claim) => selectedPlatforms.includes(claim.platform))
      return total + filtered.length
    }, 0)
  }, [mockClaims, selectedPlatforms])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pend Processing</h1>
            <p className="text-muted-foreground">
              {totalFilteredClaims} claims requiring review
            </p>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() =>
                setExpandedGroups(Object.keys(mockClaims) as Classification[])
              }
            >
              Expand All
            </Button>
            <Button variant="outline" onClick={() => setExpandedGroups([])}>
              Collapse All
            </Button>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-semibold">Filter by Platform</h3>
          <div className="flex gap-4">
            {(['Facet', 'Amisys', 'Xcelys'] as Platform[]).map((platform) => {
              const count = Object.values(mockClaims).reduce(
                (total, claims) =>
                  total + claims.filter((c) => c.platform === platform).length,
                0
              )
              return (
                <label key={platform} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                    className="h-4 w-4"
                  />
                  <span>
                    {platform} ({count})
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Classification Groups */}
        <div className="space-y-4">
          {(Object.entries(mockClaims) as [Classification, Claim[]][]).map(
            ([classification, claims]) => (
              <ClassificationGroup
                key={classification}
                classification={classification}
                claims={claims}
                expanded={expandedGroups.includes(classification)}
                onToggle={() => handleToggle(classification)}
                selectedPlatforms={selectedPlatforms}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
