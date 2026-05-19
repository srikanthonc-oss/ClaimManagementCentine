'use client'

import * as React from 'react'
import { DynamicTabs } from './dynamic-tabs'
import type { Classification, Claim } from '@/types'

/**
 * Example 1: Basic Usage
 * 
 * Simple example showing dynamic tab generation with claim counts
 */
export function BasicDynamicTabsExample() {
  const [activeTab, setActiveTab] = React.useState<Classification>('DUAL')

  const classifications: Classification[] = ['DUAL', 'COB', 'Pricing', 'Auth']
  const counts: Record<string, number> = {
    DUAL: 45,
    COB: 23,
    Pricing: 12,
    Auth: 8,
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Basic Dynamic Tabs</h2>
      <DynamicTabs
        classifications={classifications}
        counts={counts}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Classification)}
      >
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">{activeTab} Claims</h3>
          <p className="text-muted-foreground">
            Showing {counts[activeTab]} claims in the {activeTab} classification.
          </p>
        </div>
      </DynamicTabs>
    </div>
  )
}

/**
 * Example 2: With Mock Claims Data
 * 
 * Example showing tabs with actual claims data filtering
 */
export function DynamicTabsWithClaimsExample() {
  const [activeTab, setActiveTab] = React.useState<Classification>('DUAL')

  // Mock claims data
  const mockClaims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'General Hospital',
      billedAmount: 15000,
      status: 'Pending',
      confidence: 85,
      daysAged: 12,
      state: 'CA',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: '2',
      claimNumber: 'CLM-002',
      classification: 'DUAL',
      platform: 'Amisys',
      providerName: 'City Medical Center',
      billedAmount: 8500,
      status: 'In Review',
      confidence: 92,
      daysAged: 5,
      state: 'NY',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-22'),
    },
    {
      id: '3',
      claimNumber: 'CLM-003',
      classification: 'COB',
      platform: 'Xcelys',
      providerName: 'Regional Clinic',
      billedAmount: 3200,
      status: 'Pending',
      confidence: 78,
      daysAged: 8,
      state: 'TX',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-21'),
    },
    {
      id: '4',
      claimNumber: 'CLM-004',
      classification: 'Pricing',
      platform: 'Facet',
      providerName: 'Downtown Hospital',
      billedAmount: 12000,
      status: 'Approved',
      confidence: 95,
      daysAged: 3,
      state: 'FL',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-23'),
    },
  ]

  // Get unique classifications and counts
  const classifications = Array.from(
    new Set(mockClaims.map((claim) => claim.classification))
  ) as Classification[]

  const counts = mockClaims.reduce(
    (acc, claim) => {
      acc[claim.classification] = (acc[claim.classification] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Filter claims by active tab
  const filteredClaims = mockClaims.filter(
    (claim) => claim.classification === activeTab
  )

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Dynamic Tabs with Claims</h2>
      <DynamicTabs
        classifications={classifications}
        counts={counts}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Classification)}
      >
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-semibold">{claim.claimNumber}</h4>
                  <p className="text-sm text-muted-foreground">
                    {claim.providerName} • {claim.platform}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${claim.billedAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{claim.status}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Confidence: {claim.confidence}%</span>
                <span>Days Aged: {claim.daysAged}</span>
                <span>State: {claim.state}</span>
              </div>
            </div>
          ))}
          {filteredClaims.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No claims found for {activeTab} classification.
              </p>
            </div>
          )}
        </div>
      </DynamicTabs>
    </div>
  )
}

/**
 * Example 3: All Classifications
 * 
 * Example showing all possible classification types
 */
export function AllClassificationTabsExample() {
  const [activeTab, setActiveTab] = React.useState<Classification>('DUAL')

  const allClassifications: Classification[] = [
    'DUAL',
    'Duplicate',
    'COB',
    'Pricing',
    'Auth',
    'Corrected Claims',
    'High Dollar',
    'Other Pend',
  ]

  const counts: Record<string, number> = {
    DUAL: 45,
    Duplicate: 12,
    COB: 23,
    Pricing: 18,
    Auth: 8,
    'Corrected Claims': 15,
    'High Dollar': 7,
    'Other Pend': 3,
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">All Classification Types</h2>
      <p className="text-muted-foreground">
        Demonstrating all possible classification values sorted alphabetically
      </p>
      <DynamicTabs
        classifications={allClassifications}
        counts={counts}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Classification)}
      >
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">{activeTab} Classification</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Total Claims</p>
              <p className="text-3xl font-bold">{counts[activeTab]}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Classification Type</p>
              <p className="text-lg">{activeTab}</p>
            </div>
          </div>
        </div>
      </DynamicTabs>
    </div>
  )
}

/**
 * Example 4: Empty State
 * 
 * Example showing behavior with no classifications
 */
export function EmptyDynamicTabsExample() {
  const [activeTab, setActiveTab] = React.useState<string>('')

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Empty State</h2>
      <p className="text-muted-foreground">
        Demonstrating behavior when no classifications are available
      </p>
      <DynamicTabs
        classifications={[]}
        counts={{}}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No classifications available.</p>
        </div>
      </DynamicTabs>
    </div>
  )
}

/**
 * Example 5: Dynamic Updates
 * 
 * Example showing tabs updating when classifications change
 */
export function DynamicUpdateTabsExample() {
  const [activeTab, setActiveTab] = React.useState<Classification>('DUAL')
  const [showAll, setShowAll] = React.useState(false)

  const baseClassifications: Classification[] = ['DUAL', 'COB', 'Pricing']
  const allClassifications: Classification[] = [
    'DUAL',
    'COB',
    'Pricing',
    'Auth',
    'High Dollar',
  ]

  const counts: Record<string, number> = {
    DUAL: 45,
    COB: 23,
    Pricing: 12,
    Auth: 8,
    'High Dollar': 7,
  }

  const currentClassifications = showAll
    ? allClassifications
    : baseClassifications

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dynamic Updates</h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showAll ? 'Show Less' : 'Show All'}
        </button>
      </div>
      <p className="text-muted-foreground">
        Toggle to see tabs update dynamically
      </p>
      <DynamicTabs
        classifications={currentClassifications}
        counts={counts}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Classification)}
      >
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">{activeTab} Claims</h3>
          <p className="text-muted-foreground">
            Showing {counts[activeTab]} claims. Currently displaying{' '}
            {currentClassifications.length} classification
            {currentClassifications.length !== 1 ? 's' : ''}.
          </p>
        </div>
      </DynamicTabs>
    </div>
  )
}
