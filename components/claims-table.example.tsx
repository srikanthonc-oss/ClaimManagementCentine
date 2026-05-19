'use client'

import { ClaimsTable } from './claims-table'
import type { Claim } from '@/types'

/**
 * Example usage of the ClaimsTable component
 * 
 * This file demonstrates how to use the ClaimsTable component
 * with sample data in a Next.js page or component.
 */

// Sample claims data
const sampleClaims: Claim[] = [
  {
    id: '1',
    claimNumber: 'CLM-2024-001',
    classification: 'DUAL',
    platform: 'Facet',
    providerName: 'Dr. Sarah Johnson',
    billedAmount: 1500.75,
    status: 'Pending',
    confidence: 85.5,
    daysAged: 5,
    state: 'CA',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    claimNumber: 'CLM-2024-002',
    classification: 'Duplicate',
    platform: 'Amisys',
    providerName: 'Dr. Michael Chen',
    billedAmount: 2500.0,
    status: 'Approved',
    confidence: 92.3,
    daysAged: 10,
    state: 'NY',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    claimNumber: 'CLM-2024-003',
    classification: 'COB',
    platform: 'Xcelys',
    providerName: 'Dr. Emily Williams',
    billedAmount: 3500.5,
    status: 'Denied',
    confidence: 78.9,
    daysAged: 15,
    state: 'TX',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '4',
    claimNumber: 'CLM-2024-004',
    classification: 'Pricing',
    platform: 'Facet',
    providerName: 'Dr. Robert Martinez',
    billedAmount: 4200.25,
    status: 'In Review',
    confidence: 88.7,
    daysAged: 3,
    state: 'FL',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: '5',
    claimNumber: 'CLM-2024-005',
    classification: 'Auth',
    platform: 'Amisys',
    providerName: 'Dr. Jennifer Davis',
    billedAmount: 1800.0,
    status: 'Pending',
    confidence: 91.2,
    daysAged: 7,
    state: 'IL',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '6',
    claimNumber: 'CLM-2024-006',
    classification: 'High Dollar',
    platform: 'Xcelys',
    providerName: 'Dr. David Thompson',
    billedAmount: 15000.0,
    status: 'In Review',
    confidence: 95.8,
    daysAged: 2,
    state: 'WA',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: '7',
    claimNumber: 'CLM-2024-007',
    classification: 'Corrected Claims',
    platform: 'Facet',
    providerName: 'Dr. Lisa Anderson',
    billedAmount: 2200.75,
    status: 'Approved',
    confidence: 89.4,
    daysAged: 12,
    state: 'OH',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: '8',
    claimNumber: 'CLM-2024-008',
    classification: 'Other Pend',
    platform: 'Amisys',
    providerName: 'Dr. James Wilson',
    billedAmount: 3100.5,
    status: 'Pending',
    confidence: 82.6,
    daysAged: 8,
    state: 'GA',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-20'),
  },
]

/**
 * Example 1: Basic Usage
 * 
 * The simplest way to use the ClaimsTable component.
 */
export function BasicExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Claims Management</h1>
      <ClaimsTable claims={sampleClaims} />
    </div>
  )
}

/**
 * Example 2: With Custom Styling
 * 
 * Add custom CSS classes to the table container.
 */
export function StyledExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Styled Claims Table</h1>
      <ClaimsTable 
        claims={sampleClaims} 
        className="shadow-lg rounded-lg" 
      />
    </div>
  )
}

/**
 * Example 3: Empty State
 * 
 * Shows how the table handles no data.
 */
export function EmptyStateExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Empty Claims Table</h1>
      <ClaimsTable claims={[]} />
    </div>
  )
}

/**
 * Example 4: Large Dataset
 * 
 * Demonstrates performance with 1000+ claims.
 */
export function LargeDatasetExample() {
  // Generate 1000 sample claims
  const largeClaims: Claim[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `${i + 1}`,
    claimNumber: `CLM-2024-${String(i + 1).padStart(4, '0')}`,
    classification: ['DUAL', 'Duplicate', 'COB', 'Pricing', 'Auth', 'Corrected Claims', 'High Dollar', 'Other Pend'][i % 8] as any,
    platform: ['Facet', 'Amisys', 'Xcelys'][i % 3] as any,
    providerName: `Provider ${i + 1}`,
    billedAmount: Math.random() * 10000,
    status: ['Pending', 'Approved', 'Denied', 'In Review'][i % 4] as any,
    confidence: Math.random() * 100,
    daysAged: Math.floor(Math.random() * 30),
    state: ['CA', 'NY', 'TX', 'FL', 'IL', 'WA', 'OH', 'GA'][i % 8],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  }))

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Large Dataset (1000 Claims)</h1>
      <p className="text-muted-foreground mb-4">
        This example demonstrates the table&apos;s performance with 1000 claims using virtual scrolling.
      </p>
      <ClaimsTable claims={largeClaims} />
    </div>
  )
}

/**
 * Example 5: With Loading State
 * 
 * Shows how to handle loading state in the parent component.
 */
export function LoadingExample() {
  const [claims, setClaims] = React.useState<Claim[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setClaims(sampleClaims)
      setIsLoading(false)
    }, 2000)
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Loading Claims...</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Claims Loaded</h1>
      <ClaimsTable claims={claims} />
    </div>
  )
}

/**
 * Example 6: With Filtering
 * 
 * Shows how to pre-filter claims before passing to the table.
 */
export function FilteredExample() {
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>('all')

  const filteredClaims = React.useMemo(() => {
    if (selectedPlatform === 'all') return sampleClaims
    return sampleClaims.filter(claim => claim.platform === selectedPlatform)
  }, [selectedPlatform])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Filtered Claims Table</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Platform:</label>
        <select 
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Platforms</option>
          <option value="Facet">Facet</option>
          <option value="Amisys">Amisys</option>
          <option value="Xcelys">Xcelys</option>
        </select>
      </div>

      <ClaimsTable claims={filteredClaims} />
    </div>
  )
}

// Import React for the examples that use hooks
import * as React from 'react'
