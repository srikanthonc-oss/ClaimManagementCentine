/**
 * Example usage of dashboard metrics calculation utilities
 * 
 * This file demonstrates how to use the metrics functions to calculate
 * dashboard statistics from claims data.
 */

import type { Claim } from '@/types'
import {
  calculateDashboardMetrics,
  calculateAverageDaysAged,
  filterClaimsByPlatform,
  getUniqueClassifications,
} from './metrics'

// Example 1: Calculate comprehensive dashboard metrics
function example1_CalculateAllMetrics() {
  const claims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'ABC Medical Center',
      billedAmount: 5000,
      status: 'Pending',
      confidence: 85,
      daysAged: 15,
      state: 'CA',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      claimNumber: 'CLM-002',
      classification: 'Duplicate',
      platform: 'Amisys',
      providerName: 'XYZ Hospital',
      billedAmount: 3000,
      status: 'Approved',
      confidence: 92,
      daysAged: 5,
      state: 'NY',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: '3',
      claimNumber: 'CLM-003',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'DEF Clinic',
      billedAmount: 2000,
      status: 'Pending',
      confidence: 78,
      daysAged: 25,
      state: 'TX',
      createdAt: new Date('2023-12-20'),
      updatedAt: new Date('2024-01-14'),
    },
  ]

  const metrics = calculateDashboardMetrics(claims)

  console.log('Dashboard Metrics:')
  console.log('------------------')
  console.log(`Total Claims: ${metrics.totalClaims}`)
  console.log(`Total Billed: $${metrics.totalBilledAmount.toLocaleString()}`)
  console.log(`Average Billed: $${metrics.averageBilledAmount.toLocaleString()}`)
  console.log(`Average Days Aged (Pending): ${metrics.averageDaysAged.toFixed(1)} days`)
  console.log('\nClaims by Classification:')
  Object.entries(metrics.claimsByClassification).forEach(([classification, count]) => {
    if (count > 0) {
      console.log(`  ${classification}: ${count}`)
    }
  })
  console.log('\nClaims by Platform:')
  Object.entries(metrics.claimsByPlatform).forEach(([platform, count]) => {
    if (count > 0) {
      console.log(`  ${platform}: ${count}`)
    }
  })
  console.log('\nClaims by Status:')
  Object.entries(metrics.claimsByStatus).forEach(([status, count]) => {
    if (count > 0) {
      console.log(`  ${status}: ${count}`)
    }
  })

  /* Expected Output:
  Dashboard Metrics:
  ------------------
  Total Claims: 3
  Total Billed: $10,000
  Average Billed: $3,333
  Average Days Aged (Pending): 20.0 days

  Claims by Classification:
    DUAL: 2
    Duplicate: 1

  Claims by Platform:
    Facet: 2
    Amisys: 1

  Claims by Status:
    Pending: 2
    Approved: 1
  */
}

// Example 2: Calculate average days aged for pending claims
function example2_AverageDaysAgedForPending() {
  const claims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Provider A',
      billedAmount: 1000,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      claimNumber: 'CLM-002',
      classification: 'Pricing',
      platform: 'Amisys',
      providerName: 'Provider B',
      billedAmount: 2000,
      status: 'Pending',
      confidence: 90,
      daysAged: 30,
      state: 'NY',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      claimNumber: 'CLM-003',
      classification: 'COB',
      platform: 'Xcelys',
      providerName: 'Provider C',
      billedAmount: 1500,
      status: 'Approved', // This will be excluded from average
      confidence: 95,
      daysAged: 100,
      state: 'TX',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const avgDaysAged = calculateAverageDaysAged(claims)
  console.log(`Average Days Aged for Pending Claims: ${avgDaysAged} days`)
  // Expected: 20 days (average of 10 and 30, excluding the approved claim)
}

// Example 3: Filter claims by platform and calculate metrics
function example3_FilterAndCalculate() {
  const allClaims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Provider A',
      billedAmount: 5000,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      claimNumber: 'CLM-002',
      classification: 'Pricing',
      platform: 'Amisys',
      providerName: 'Provider B',
      billedAmount: 3000,
      status: 'Approved',
      confidence: 90,
      daysAged: 5,
      state: 'NY',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      claimNumber: 'CLM-003',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Provider C',
      billedAmount: 4000,
      status: 'Pending',
      confidence: 88,
      daysAged: 15,
      state: 'TX',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  // Filter to only Facet platform claims
  const facetClaims = filterClaimsByPlatform(allClaims, 'Facet')
  const facetMetrics = calculateDashboardMetrics(facetClaims)

  console.log('Facet Platform Metrics:')
  console.log(`Total Claims: ${facetMetrics.totalClaims}`)
  console.log(`Total Billed: $${facetMetrics.totalBilledAmount.toLocaleString()}`)
  console.log(`Average Days Aged: ${facetMetrics.averageDaysAged.toFixed(1)} days`)

  /* Expected Output:
  Facet Platform Metrics:
  Total Claims: 2
  Total Billed: $9,000
  Average Days Aged: 12.5 days
  */
}

// Example 4: Generate dynamic tabs based on unique classifications
function example4_DynamicTabGeneration() {
  const claims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Provider A',
      billedAmount: 1000,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      claimNumber: 'CLM-002',
      classification: 'Pricing',
      platform: 'Amisys',
      providerName: 'Provider B',
      billedAmount: 2000,
      status: 'Approved',
      confidence: 90,
      daysAged: 5,
      state: 'NY',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      claimNumber: 'CLM-003',
      classification: 'DUAL',
      platform: 'Xcelys',
      providerName: 'Provider C',
      billedAmount: 1500,
      status: 'Pending',
      confidence: 88,
      daysAged: 15,
      state: 'TX',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      claimNumber: 'CLM-004',
      classification: 'COB',
      platform: 'Facet',
      providerName: 'Provider D',
      billedAmount: 3000,
      status: 'Denied',
      confidence: 75,
      daysAged: 20,
      state: 'FL',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const uniqueClassifications = getUniqueClassifications(claims)
  const metrics = calculateDashboardMetrics(claims)

  console.log('Dynamic Tabs:')
  uniqueClassifications.forEach((classification) => {
    const count = metrics.claimsByClassification[classification]
    console.log(`  Tab: ${classification} (${count} claims)`)
  })

  /* Expected Output:
  Dynamic Tabs:
    Tab: COB (1 claims)
    Tab: DUAL (2 claims)
    Tab: Pricing (1 claims)
  */
}

// Example 5: Real-time dashboard updates
function example5_RealTimeDashboard() {
  // Simulate initial claims data
  let claims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Provider A',
      billedAmount: 5000,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  console.log('Initial Metrics:')
  let metrics = calculateDashboardMetrics(claims)
  console.log(`Total Claims: ${metrics.totalClaims}`)
  console.log(`Total Billed: $${metrics.totalBilledAmount}`)

  // Simulate adding a new claim
  claims = [
    ...claims,
    {
      id: '2',
      claimNumber: 'CLM-002',
      classification: 'Pricing',
      platform: 'Amisys',
      providerName: 'Provider B',
      billedAmount: 3000,
      status: 'Approved',
      confidence: 90,
      daysAged: 5,
      state: 'NY',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  console.log('\nUpdated Metrics (after adding new claim):')
  metrics = calculateDashboardMetrics(claims)
  console.log(`Total Claims: ${metrics.totalClaims}`)
  console.log(`Total Billed: $${metrics.totalBilledAmount}`)

  /* Expected Output:
  Initial Metrics:
  Total Claims: 1
  Total Billed: $5000

  Updated Metrics (after adding new claim):
  Total Claims: 2
  Total Billed: $8000
  */
}

// Export examples for demonstration
export {
  example1_CalculateAllMetrics,
  example2_AverageDaysAgedForPending,
  example3_FilterAndCalculate,
  example4_DynamicTabGeneration,
  example5_RealTimeDashboard,
}
