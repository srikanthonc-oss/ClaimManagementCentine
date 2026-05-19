/**
 * Example usage of data formatting utilities
 * This file demonstrates how to use the formatting functions in real scenarios
 */

import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatConfidence,
  formatPercentage,
  getStatusBadge,
  formatDaysAged,
  formatNumber,
} from './utils'
import type { Claim } from '@/types'

// Example claim data
const exampleClaim: Claim = {
  id: '1',
  claimNumber: 'CLM-2024-001',
  classification: 'DUAL',
  platform: 'Facet',
  providerName: 'General Hospital',
  billedAmount: 15234.56,
  status: 'Pending',
  confidence: 87.5,
  daysAged: 15,
  state: 'CA',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date(),
}

// Example: Formatting claim data for display
export function formatClaimForDisplay(claim: Claim) {
  return {
    claimNumber: claim.claimNumber,
    provider: claim.providerName,
    amount: formatCurrency(claim.billedAmount),
    status: getStatusBadge(claim.status),
    confidence: formatConfidence(claim.confidence),
    age: formatDaysAged(claim.daysAged),
    created: formatDate(claim.createdAt),
    lastUpdated: formatRelativeDate(claim.updatedAt),
  }
}

// Example: Dashboard metrics formatting
export function formatDashboardMetrics(metrics: {
  totalClaims: number
  totalBilledAmount: number
  averageBilledAmount: number
  averageDaysAged: number
  approvalRate: number
}) {
  return {
    totalClaims: formatNumber(metrics.totalClaims),
    totalBilled: formatCurrency(metrics.totalBilledAmount, { showCents: false }),
    averageBilled: formatCurrency(metrics.averageBilledAmount),
    averageAge: formatDaysAged(Math.round(metrics.averageDaysAged)),
    approvalRate: formatPercentage(metrics.approvalRate),
  }
}

// Example: Table cell formatting
export function formatTableCell(value: unknown, type: string): string {
  switch (type) {
    case 'currency':
      return typeof value === 'number' ? formatCurrency(value) : '$0.00'
    case 'date':
      return value instanceof Date || typeof value === 'string'
        ? formatDate(value)
        : 'N/A'
    case 'relativeDate':
      return value instanceof Date || typeof value === 'string'
        ? formatRelativeDate(value)
        : 'N/A'
    case 'confidence':
      return typeof value === 'number' ? formatConfidence(value) : '0%'
    case 'percentage':
      return typeof value === 'number' ? formatPercentage(value) : '0%'
    case 'daysAged':
      return typeof value === 'number' ? formatDaysAged(value) : '0 days'
    case 'number':
      return typeof value === 'number' ? formatNumber(value) : '0'
    default:
      return String(value)
  }
}

// Example usage in console
if (require.main === module) {
  console.log('=== Claim Formatting Example ===')
  console.log(formatClaimForDisplay(exampleClaim))

  console.log('\n=== Dashboard Metrics Example ===')
  console.log(
    formatDashboardMetrics({
      totalClaims: 1234,
      totalBilledAmount: 5678901.23,
      averageBilledAmount: 4567.89,
      averageDaysAged: 12.5,
      approvalRate: 87.3,
    })
  )

  console.log('\n=== Individual Formatting Examples ===')
  console.log('Currency:', formatCurrency(15234.56))
  console.log('Date:', formatDate(new Date()))
  console.log('Relative Date:', formatRelativeDate(new Date(Date.now() - 86400000)))
  console.log('Confidence:', formatConfidence(87.5))
  console.log('Percentage:', formatPercentage(45.7))
  console.log('Days Aged:', formatDaysAged(15))
  console.log('Number:', formatNumber(1234567))
  console.log('Status Badge:', getStatusBadge('Approved'))
}
