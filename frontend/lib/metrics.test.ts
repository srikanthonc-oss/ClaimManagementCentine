import { describe, it, expect } from 'vitest'
import type { Claim } from '@/types'
import {
  calculateDashboardMetrics,
  calculateTotalClaims,
  calculateClaimsByClassification,
  calculateClaimsByPlatform,
  calculateClaimsByStatus,
  calculateTotalBilledAmount,
  calculateAverageBilledAmount,
  calculateAverageDaysAged,
  filterClaimsByPlatform,
  filterClaimsByClassification,
  filterClaimsByStatus,
  getUniqueClassifications,
  getUniquePlatforms,
  getUniqueStatuses,
} from './metrics'

// Helper function to create mock claims
function createMockClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: '1',
    claimNumber: 'CLM-001',
    classification: 'DUAL',
    platform: 'Facet',
    providerName: 'Test Provider',
    billedAmount: 1000,
    status: 'Pending',
    confidence: 85,
    daysAged: 10,
    state: 'CA',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

describe('calculateDashboardMetrics', () => {
  it('should return zero metrics for empty claims array', () => {
    const metrics = calculateDashboardMetrics([])

    expect(metrics.totalClaims).toBe(0)
    expect(metrics.totalBilledAmount).toBe(0)
    expect(metrics.averageBilledAmount).toBe(0)
    expect(metrics.averageDaysAged).toBe(0)
    expect(metrics.lastUpdated).toBeInstanceOf(Date)
  })

  it('should calculate total claims correctly', () => {
    const claims = [createMockClaim(), createMockClaim({ id: '2' }), createMockClaim({ id: '3' })]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.totalClaims).toBe(3)
  })

  it('should calculate claims by classification correctly', () => {
    const claims = [
      createMockClaim({ classification: 'DUAL' }),
      createMockClaim({ id: '2', classification: 'DUAL' }),
      createMockClaim({ id: '3', classification: 'Duplicate' }),
      createMockClaim({ id: '4', classification: 'COB' }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.claimsByClassification.DUAL).toBe(2)
    expect(metrics.claimsByClassification.Duplicate).toBe(1)
    expect(metrics.claimsByClassification.COB).toBe(1)
    expect(metrics.claimsByClassification.Pricing).toBe(0)
  })

  it('should calculate claims by platform correctly', () => {
    const claims = [
      createMockClaim({ platform: 'Facet' }),
      createMockClaim({ id: '2', platform: 'Facet' }),
      createMockClaim({ id: '3', platform: 'Amisys' }),
      createMockClaim({ id: '4', platform: 'Xcelys' }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.claimsByPlatform.Facet).toBe(2)
    expect(metrics.claimsByPlatform.Amisys).toBe(1)
    expect(metrics.claimsByPlatform.Xcelys).toBe(1)
  })

  it('should calculate claims by status correctly', () => {
    const claims = [
      createMockClaim({ status: 'Pending' }),
      createMockClaim({ id: '2', status: 'Pending' }),
      createMockClaim({ id: '3', status: 'Approved' }),
      createMockClaim({ id: '4', status: 'Denied' }),
      createMockClaim({ id: '5', status: 'In Review' }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.claimsByStatus.Pending).toBe(2)
    expect(metrics.claimsByStatus.Approved).toBe(1)
    expect(metrics.claimsByStatus.Denied).toBe(1)
    expect(metrics.claimsByStatus['In Review']).toBe(1)
  })

  it('should calculate total billed amount correctly', () => {
    const claims = [
      createMockClaim({ billedAmount: 1000 }),
      createMockClaim({ id: '2', billedAmount: 2000 }),
      createMockClaim({ id: '3', billedAmount: 1500 }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.totalBilledAmount).toBe(4500)
  })

  it('should calculate average billed amount correctly', () => {
    const claims = [
      createMockClaim({ billedAmount: 1000 }),
      createMockClaim({ id: '2', billedAmount: 2000 }),
      createMockClaim({ id: '3', billedAmount: 1500 }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.averageBilledAmount).toBe(1500)
  })

  it('should calculate average days aged for pending claims only', () => {
    const claims = [
      createMockClaim({ status: 'Pending', daysAged: 10 }),
      createMockClaim({ id: '2', status: 'Pending', daysAged: 20 }),
      createMockClaim({ id: '3', status: 'Approved', daysAged: 100 }), // Should not be included
      createMockClaim({ id: '4', status: 'Denied', daysAged: 200 }), // Should not be included
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.averageDaysAged).toBe(15) // (10 + 20) / 2
  })

  it('should return 0 for average days aged when no pending claims', () => {
    const claims = [
      createMockClaim({ status: 'Approved', daysAged: 100 }),
      createMockClaim({ id: '2', status: 'Denied', daysAged: 200 }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.averageDaysAged).toBe(0)
  })

  it('should handle mixed claim data correctly', () => {
    const claims = [
      createMockClaim({
        id: '1',
        classification: 'DUAL',
        platform: 'Facet',
        status: 'Pending',
        billedAmount: 1000,
        daysAged: 10,
      }),
      createMockClaim({
        id: '2',
        classification: 'Duplicate',
        platform: 'Amisys',
        status: 'Approved',
        billedAmount: 2000,
        daysAged: 5,
      }),
      createMockClaim({
        id: '3',
        classification: 'DUAL',
        platform: 'Facet',
        status: 'Pending',
        billedAmount: 1500,
        daysAged: 20,
      }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.totalClaims).toBe(3)
    expect(metrics.claimsByClassification.DUAL).toBe(2)
    expect(metrics.claimsByClassification.Duplicate).toBe(1)
    expect(metrics.claimsByPlatform.Facet).toBe(2)
    expect(metrics.claimsByPlatform.Amisys).toBe(1)
    expect(metrics.claimsByStatus.Pending).toBe(2)
    expect(metrics.claimsByStatus.Approved).toBe(1)
    expect(metrics.totalBilledAmount).toBe(4500)
    expect(metrics.averageBilledAmount).toBe(1500)
    expect(metrics.averageDaysAged).toBe(15) // (10 + 20) / 2, excluding approved claim
  })
})

describe('calculateTotalClaims', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotalClaims([])).toBe(0)
  })

  it('should return correct count for multiple claims', () => {
    const claims = [createMockClaim(), createMockClaim({ id: '2' }), createMockClaim({ id: '3' })]
    expect(calculateTotalClaims(claims)).toBe(3)
  })
})

describe('calculateClaimsByClassification', () => {
  it('should return zero counts for empty array', () => {
    const counts = calculateClaimsByClassification([])

    expect(counts.DUAL).toBe(0)
    expect(counts.Duplicate).toBe(0)
    expect(counts.COB).toBe(0)
  })

  it('should count claims by classification correctly', () => {
    const claims = [
      createMockClaim({ classification: 'DUAL' }),
      createMockClaim({ id: '2', classification: 'DUAL' }),
      createMockClaim({ id: '3', classification: 'Pricing' }),
    ]

    const counts = calculateClaimsByClassification(claims)

    expect(counts.DUAL).toBe(2)
    expect(counts.Pricing).toBe(1)
    expect(counts.Duplicate).toBe(0)
  })
})

describe('calculateClaimsByPlatform', () => {
  it('should return zero counts for empty array', () => {
    const counts = calculateClaimsByPlatform([])

    expect(counts.Facet).toBe(0)
    expect(counts.Amisys).toBe(0)
    expect(counts.Xcelys).toBe(0)
  })

  it('should count claims by platform correctly', () => {
    const claims = [
      createMockClaim({ platform: 'Facet' }),
      createMockClaim({ id: '2', platform: 'Amisys' }),
      createMockClaim({ id: '3', platform: 'Facet' }),
    ]

    const counts = calculateClaimsByPlatform(claims)

    expect(counts.Facet).toBe(2)
    expect(counts.Amisys).toBe(1)
    expect(counts.Xcelys).toBe(0)
  })
})

describe('calculateClaimsByStatus', () => {
  it('should return zero counts for empty array', () => {
    const counts = calculateClaimsByStatus([])

    expect(counts.Pending).toBe(0)
    expect(counts.Approved).toBe(0)
    expect(counts.Denied).toBe(0)
    expect(counts['In Review']).toBe(0)
  })

  it('should count claims by status correctly', () => {
    const claims = [
      createMockClaim({ status: 'Pending' }),
      createMockClaim({ id: '2', status: 'Approved' }),
      createMockClaim({ id: '3', status: 'Pending' }),
    ]

    const counts = calculateClaimsByStatus(claims)

    expect(counts.Pending).toBe(2)
    expect(counts.Approved).toBe(1)
    expect(counts.Denied).toBe(0)
  })
})

describe('calculateTotalBilledAmount', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotalBilledAmount([])).toBe(0)
  })

  it('should sum billed amounts correctly', () => {
    const claims = [
      createMockClaim({ billedAmount: 1000 }),
      createMockClaim({ id: '2', billedAmount: 2500 }),
      createMockClaim({ id: '3', billedAmount: 500 }),
    ]

    expect(calculateTotalBilledAmount(claims)).toBe(4000)
  })

  it('should handle decimal amounts correctly', () => {
    const claims = [
      createMockClaim({ billedAmount: 1000.5 }),
      createMockClaim({ id: '2', billedAmount: 2500.75 }),
    ]

    expect(calculateTotalBilledAmount(claims)).toBe(3501.25)
  })
})

describe('calculateAverageBilledAmount', () => {
  it('should return 0 for empty array', () => {
    expect(calculateAverageBilledAmount([])).toBe(0)
  })

  it('should calculate average correctly', () => {
    const claims = [
      createMockClaim({ billedAmount: 1000 }),
      createMockClaim({ id: '2', billedAmount: 2000 }),
      createMockClaim({ id: '3', billedAmount: 3000 }),
    ]

    expect(calculateAverageBilledAmount(claims)).toBe(2000)
  })

  it('should handle decimal averages correctly', () => {
    const claims = [
      createMockClaim({ billedAmount: 1000 }),
      createMockClaim({ id: '2', billedAmount: 1500 }),
    ]

    expect(calculateAverageBilledAmount(claims)).toBe(1250)
  })
})

describe('calculateAverageDaysAged', () => {
  it('should return 0 for empty array', () => {
    expect(calculateAverageDaysAged([])).toBe(0)
  })

  it('should return 0 when no pending claims', () => {
    const claims = [
      createMockClaim({ status: 'Approved', daysAged: 100 }),
      createMockClaim({ id: '2', status: 'Denied', daysAged: 200 }),
    ]

    expect(calculateAverageDaysAged(claims)).toBe(0)
  })

  it('should calculate average for pending claims only', () => {
    const claims = [
      createMockClaim({ status: 'Pending', daysAged: 10 }),
      createMockClaim({ id: '2', status: 'Pending', daysAged: 30 }),
      createMockClaim({ id: '3', status: 'Approved', daysAged: 1000 }), // Should be excluded
    ]

    expect(calculateAverageDaysAged(claims)).toBe(20)
  })

  it('should handle single pending claim', () => {
    const claims = [createMockClaim({ status: 'Pending', daysAged: 15 })]

    expect(calculateAverageDaysAged(claims)).toBe(15)
  })
})

describe('filterClaimsByPlatform', () => {
  it('should return empty array for empty input', () => {
    expect(filterClaimsByPlatform([], 'Facet')).toEqual([])
  })

  it('should filter claims by platform correctly', () => {
    const claims = [
      createMockClaim({ id: '1', platform: 'Facet' }),
      createMockClaim({ id: '2', platform: 'Amisys' }),
      createMockClaim({ id: '3', platform: 'Facet' }),
    ]

    const filtered = filterClaimsByPlatform(claims, 'Facet')

    expect(filtered).toHaveLength(2)
    expect(filtered[0].id).toBe('1')
    expect(filtered[1].id).toBe('3')
  })

  it('should return empty array when no matches', () => {
    const claims = [createMockClaim({ platform: 'Facet' })]

    expect(filterClaimsByPlatform(claims, 'Xcelys')).toEqual([])
  })
})

describe('filterClaimsByClassification', () => {
  it('should return empty array for empty input', () => {
    expect(filterClaimsByClassification([], 'DUAL')).toEqual([])
  })

  it('should filter claims by classification correctly', () => {
    const claims = [
      createMockClaim({ id: '1', classification: 'DUAL' }),
      createMockClaim({ id: '2', classification: 'Duplicate' }),
      createMockClaim({ id: '3', classification: 'DUAL' }),
    ]

    const filtered = filterClaimsByClassification(claims, 'DUAL')

    expect(filtered).toHaveLength(2)
    expect(filtered[0].id).toBe('1')
    expect(filtered[1].id).toBe('3')
  })
})

describe('filterClaimsByStatus', () => {
  it('should return empty array for empty input', () => {
    expect(filterClaimsByStatus([], 'Pending')).toEqual([])
  })

  it('should filter claims by status correctly', () => {
    const claims = [
      createMockClaim({ id: '1', status: 'Pending' }),
      createMockClaim({ id: '2', status: 'Approved' }),
      createMockClaim({ id: '3', status: 'Pending' }),
    ]

    const filtered = filterClaimsByStatus(claims, 'Pending')

    expect(filtered).toHaveLength(2)
    expect(filtered[0].id).toBe('1')
    expect(filtered[1].id).toBe('3')
  })
})

describe('getUniqueClassifications', () => {
  it('should return empty array for empty input', () => {
    expect(getUniqueClassifications([])).toEqual([])
  })

  it('should return unique classifications sorted', () => {
    const claims = [
      createMockClaim({ classification: 'DUAL' }),
      createMockClaim({ id: '2', classification: 'Pricing' }),
      createMockClaim({ id: '3', classification: 'DUAL' }),
      createMockClaim({ id: '4', classification: 'Auth' }),
    ]

    const unique = getUniqueClassifications(claims)

    expect(unique).toEqual(['Auth', 'DUAL', 'Pricing'])
  })
})

describe('getUniquePlatforms', () => {
  it('should return empty array for empty input', () => {
    expect(getUniquePlatforms([])).toEqual([])
  })

  it('should return unique platforms sorted', () => {
    const claims = [
      createMockClaim({ platform: 'Facet' }),
      createMockClaim({ id: '2', platform: 'Xcelys' }),
      createMockClaim({ id: '3', platform: 'Facet' }),
    ]

    const unique = getUniquePlatforms(claims)

    expect(unique).toEqual(['Facet', 'Xcelys'])
  })
})

describe('getUniqueStatuses', () => {
  it('should return empty array for empty input', () => {
    expect(getUniqueStatuses([])).toEqual([])
  })

  it('should return unique statuses sorted', () => {
    const claims = [
      createMockClaim({ status: 'Pending' }),
      createMockClaim({ id: '2', status: 'Approved' }),
      createMockClaim({ id: '3', status: 'Pending' }),
      createMockClaim({ id: '4', status: 'Denied' }),
    ]

    const unique = getUniqueStatuses(claims)

    expect(unique).toEqual(['Approved', 'Denied', 'Pending'])
  })
})

describe('Edge Cases', () => {
  it('should handle claims with zero billed amount', () => {
    const claims = [
      createMockClaim({ billedAmount: 0 }),
      createMockClaim({ id: '2', billedAmount: 1000 }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.totalBilledAmount).toBe(1000)
    expect(metrics.averageBilledAmount).toBe(500)
  })

  it('should handle claims with zero days aged', () => {
    const claims = [
      createMockClaim({ status: 'Pending', daysAged: 0 }),
      createMockClaim({ id: '2', status: 'Pending', daysAged: 10 }),
    ]

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.averageDaysAged).toBe(5)
  })

  it('should handle large numbers of claims efficiently', () => {
    const claims = Array.from({ length: 1000 }, (_, i) =>
      createMockClaim({
        id: `${i}`,
        billedAmount: 1000,
        daysAged: 10,
        status: 'Pending',
      })
    )

    const metrics = calculateDashboardMetrics(claims)

    expect(metrics.totalClaims).toBe(1000)
    expect(metrics.totalBilledAmount).toBe(1000000)
    expect(metrics.averageBilledAmount).toBe(1000)
    expect(metrics.averageDaysAged).toBe(10)
  })
})
