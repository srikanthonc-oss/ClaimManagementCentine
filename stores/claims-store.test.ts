import { describe, it, expect, beforeEach } from 'vitest'
import { useClaimsStore } from './claims-store'
import type { Claim } from '@/types'

// Helper function to create mock claims
const createMockClaim = (overrides: Partial<Claim> = {}): Claim => ({
  id: 'claim-1',
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
})

describe('Claims Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useClaimsStore.getState().clearClaims()
  })

  describe('Actions', () => {
    describe('setClaims', () => {
      it('should set claims replacing existing ones', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        const claim2 = createMockClaim({ id: 'claim-2' })
        const claim3 = createMockClaim({ id: 'claim-3' })

        useClaimsStore.getState().setClaims([claim1, claim2])
        expect(useClaimsStore.getState().claims).toHaveLength(2)

        useClaimsStore.getState().setClaims([claim3])
        expect(useClaimsStore.getState().claims).toHaveLength(1)
        expect(useClaimsStore.getState().claims[0].id).toBe('claim-3')
      })

      it('should handle empty array', () => {
        const claim1 = createMockClaim()
        useClaimsStore.getState().setClaims([claim1])
        expect(useClaimsStore.getState().claims).toHaveLength(1)

        useClaimsStore.getState().setClaims([])
        expect(useClaimsStore.getState().claims).toHaveLength(0)
      })
    })

    describe('addClaims', () => {
      it('should add new claims to existing ones', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        const claim2 = createMockClaim({ id: 'claim-2' })
        const claim3 = createMockClaim({ id: 'claim-3' })

        useClaimsStore.getState().setClaims([claim1])
        useClaimsStore.getState().addClaims([claim2, claim3])

        expect(useClaimsStore.getState().claims).toHaveLength(3)
      })

      it('should prevent duplicate claims by ID', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        const claim1Duplicate = createMockClaim({ id: 'claim-1', claimNumber: 'CLM-999' })

        useClaimsStore.getState().setClaims([claim1])
        useClaimsStore.getState().addClaims([claim1Duplicate])

        expect(useClaimsStore.getState().claims).toHaveLength(1)
        expect(useClaimsStore.getState().claims[0].claimNumber).toBe('CLM-001')
      })

      it('should add to empty store', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        useClaimsStore.getState().addClaims([claim1])

        expect(useClaimsStore.getState().claims).toHaveLength(1)
      })
    })

    describe('clearClaims', () => {
      it('should remove all claims', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        const claim2 = createMockClaim({ id: 'claim-2' })

        useClaimsStore.getState().setClaims([claim1, claim2])
        expect(useClaimsStore.getState().claims).toHaveLength(2)

        useClaimsStore.getState().clearClaims()
        expect(useClaimsStore.getState().claims).toHaveLength(0)
      })

      it('should handle clearing empty store', () => {
        useClaimsStore.getState().clearClaims()
        expect(useClaimsStore.getState().claims).toHaveLength(0)
      })
    })

    describe('updateClaim', () => {
      it('should update specific claim by ID', () => {
        const claim1 = createMockClaim({ id: 'claim-1', status: 'Pending' })
        const claim2 = createMockClaim({ id: 'claim-2', status: 'Pending' })

        useClaimsStore.getState().setClaims([claim1, claim2])
        useClaimsStore.getState().updateClaim('claim-1', { status: 'Approved' })

        const claims = useClaimsStore.getState().claims
        expect(claims[0].status).toBe('Approved')
        expect(claims[1].status).toBe('Pending')
      })

      it('should update updatedAt timestamp', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        const originalUpdatedAt = claim1.updatedAt

        useClaimsStore.getState().setClaims([claim1])
        
        // Wait a bit to ensure timestamp difference
        setTimeout(() => {
          useClaimsStore.getState().updateClaim('claim-1', { status: 'Approved' })
          const updatedClaim = useClaimsStore.getState().claims[0]
          expect(updatedClaim.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
        }, 10)
      })

      it('should handle updating non-existent claim', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        useClaimsStore.getState().setClaims([claim1])

        useClaimsStore.getState().updateClaim('non-existent', { status: 'Approved' })
        
        const claims = useClaimsStore.getState().claims
        expect(claims).toHaveLength(1)
        expect(claims[0].status).toBe('Pending')
      })

      it('should update multiple fields', () => {
        const claim1 = createMockClaim({ id: 'claim-1' })
        useClaimsStore.getState().setClaims([claim1])

        useClaimsStore.getState().updateClaim('claim-1', {
          status: 'Approved',
          confidence: 95,
          daysAged: 15,
        })

        const updatedClaim = useClaimsStore.getState().claims[0]
        expect(updatedClaim.status).toBe('Approved')
        expect(updatedClaim.confidence).toBe(95)
        expect(updatedClaim.daysAged).toBe(15)
      })
    })
  })

  describe('Selectors', () => {
    describe('getClaimsByPlatform', () => {
      it('should filter claims by platform', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', platform: 'Facet' }),
          createMockClaim({ id: 'claim-2', platform: 'Amisys' }),
          createMockClaim({ id: 'claim-3', platform: 'Facet' }),
          createMockClaim({ id: 'claim-4', platform: 'Xcelys' }),
        ]

        useClaimsStore.getState().setClaims(claims)

        const facetClaims = useClaimsStore.getState().getClaimsByPlatform('Facet')
        expect(facetClaims).toHaveLength(2)
        expect(facetClaims.every((c) => c.platform === 'Facet')).toBe(true)

        const amisysClaims = useClaimsStore.getState().getClaimsByPlatform('Amisys')
        expect(amisysClaims).toHaveLength(1)

        const xcelysClaims = useClaimsStore.getState().getClaimsByPlatform('Xcelys')
        expect(xcelysClaims).toHaveLength(1)
      })

      it('should return empty array when no matches', () => {
        const claims = [createMockClaim({ id: 'claim-1', platform: 'Facet' })]
        useClaimsStore.getState().setClaims(claims)

        const amisysClaims = useClaimsStore.getState().getClaimsByPlatform('Amisys')
        expect(amisysClaims).toHaveLength(0)
      })
    })

    describe('getClaimsByClassification', () => {
      it('should filter claims by classification', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', classification: 'DUAL' }),
          createMockClaim({ id: 'claim-2', classification: 'Duplicate' }),
          createMockClaim({ id: 'claim-3', classification: 'DUAL' }),
          createMockClaim({ id: 'claim-4', classification: 'COB' }),
        ]

        useClaimsStore.getState().setClaims(claims)

        const dualClaims = useClaimsStore.getState().getClaimsByClassification('DUAL')
        expect(dualClaims).toHaveLength(2)
        expect(dualClaims.every((c) => c.classification === 'DUAL')).toBe(true)

        const duplicateClaims = useClaimsStore.getState().getClaimsByClassification('Duplicate')
        expect(duplicateClaims).toHaveLength(1)
      })

      it('should return empty array when no matches', () => {
        const claims = [createMockClaim({ id: 'claim-1', classification: 'DUAL' })]
        useClaimsStore.getState().setClaims(claims)

        const pricingClaims = useClaimsStore.getState().getClaimsByClassification('Pricing')
        expect(pricingClaims).toHaveLength(0)
      })
    })

    describe('getClaimsByStatus', () => {
      it('should filter claims by status', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', status: 'Pending' }),
          createMockClaim({ id: 'claim-2', status: 'Approved' }),
          createMockClaim({ id: 'claim-3', status: 'Pending' }),
          createMockClaim({ id: 'claim-4', status: 'Denied' }),
        ]

        useClaimsStore.getState().setClaims(claims)

        const pendingClaims = useClaimsStore.getState().getClaimsByStatus('Pending')
        expect(pendingClaims).toHaveLength(2)
        expect(pendingClaims.every((c) => c.status === 'Pending')).toBe(true)

        const approvedClaims = useClaimsStore.getState().getClaimsByStatus('Approved')
        expect(approvedClaims).toHaveLength(1)
      })

      it('should return empty array when no matches', () => {
        const claims = [createMockClaim({ id: 'claim-1', status: 'Pending' })]
        useClaimsStore.getState().setClaims(claims)

        const deniedClaims = useClaimsStore.getState().getClaimsByStatus('Denied')
        expect(deniedClaims).toHaveLength(0)
      })
    })

    describe('getClaimsByPlatforms', () => {
      it('should filter claims by multiple platforms', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', platform: 'Facet' }),
          createMockClaim({ id: 'claim-2', platform: 'Amisys' }),
          createMockClaim({ id: 'claim-3', platform: 'Facet' }),
          createMockClaim({ id: 'claim-4', platform: 'Xcelys' }),
        ]

        useClaimsStore.getState().setClaims(claims)

        const filteredClaims = useClaimsStore.getState().getClaimsByPlatforms(['Facet', 'Amisys'])
        expect(filteredClaims).toHaveLength(3)
        expect(filteredClaims.every((c) => c.platform === 'Facet' || c.platform === 'Amisys')).toBe(true)
      })

      it('should return all claims when empty array provided', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', platform: 'Facet' }),
          createMockClaim({ id: 'claim-2', platform: 'Amisys' }),
        ]

        useClaimsStore.getState().setClaims(claims)

        const allClaims = useClaimsStore.getState().getClaimsByPlatforms([])
        expect(allClaims).toHaveLength(2)
      })

      it('should handle single platform', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', platform: 'Facet' }),
          createMockClaim({ id: 'claim-2', platform: 'Amisys' }),
        ]

        useClaimsStore.getState().setClaims(claims)

        const facetClaims = useClaimsStore.getState().getClaimsByPlatforms(['Facet'])
        expect(facetClaims).toHaveLength(1)
        expect(facetClaims[0].platform).toBe('Facet')
      })
    })
  })

  describe('Computed Metrics', () => {
    describe('getTotalCount', () => {
      it('should return total count of claims', () => {
        const claims = [
          createMockClaim({ id: 'claim-1' }),
          createMockClaim({ id: 'claim-2' }),
          createMockClaim({ id: 'claim-3' }),
        ]

        useClaimsStore.getState().setClaims(claims)
        expect(useClaimsStore.getState().getTotalCount()).toBe(3)
      })

      it('should return 0 for empty store', () => {
        expect(useClaimsStore.getState().getTotalCount()).toBe(0)
      })
    })

    describe('getCountByClassification', () => {
      it('should return counts grouped by classification', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', classification: 'DUAL' }),
          createMockClaim({ id: 'claim-2', classification: 'DUAL' }),
          createMockClaim({ id: 'claim-3', classification: 'Duplicate' }),
          createMockClaim({ id: 'claim-4', classification: 'COB' }),
          createMockClaim({ id: 'claim-5', classification: 'DUAL' }),
        ]

        useClaimsStore.getState().setClaims(claims)
        const counts = useClaimsStore.getState().getCountByClassification()

        expect(counts.DUAL).toBe(3)
        expect(counts.Duplicate).toBe(1)
        expect(counts.COB).toBe(1)
        expect(counts.Pricing).toBe(0)
        expect(counts.Auth).toBe(0)
      })

      it('should return all zeros for empty store', () => {
        const counts = useClaimsStore.getState().getCountByClassification()

        expect(counts.DUAL).toBe(0)
        expect(counts.Duplicate).toBe(0)
        expect(counts.COB).toBe(0)
        expect(counts.Pricing).toBe(0)
        expect(counts.Auth).toBe(0)
        expect(counts['Corrected Claims']).toBe(0)
        expect(counts['High Dollar']).toBe(0)
        expect(counts['Other Pend']).toBe(0)
      })
    })

    describe('getCountByPlatform', () => {
      it('should return counts grouped by platform', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', platform: 'Facet' }),
          createMockClaim({ id: 'claim-2', platform: 'Facet' }),
          createMockClaim({ id: 'claim-3', platform: 'Amisys' }),
          createMockClaim({ id: 'claim-4', platform: 'Xcelys' }),
          createMockClaim({ id: 'claim-5', platform: 'Facet' }),
        ]

        useClaimsStore.getState().setClaims(claims)
        const counts = useClaimsStore.getState().getCountByPlatform()

        expect(counts.Facet).toBe(3)
        expect(counts.Amisys).toBe(1)
        expect(counts.Xcelys).toBe(1)
      })

      it('should return all zeros for empty store', () => {
        const counts = useClaimsStore.getState().getCountByPlatform()

        expect(counts.Facet).toBe(0)
        expect(counts.Amisys).toBe(0)
        expect(counts.Xcelys).toBe(0)
      })
    })

    describe('getCountByStatus', () => {
      it('should return counts grouped by status', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', status: 'Pending' }),
          createMockClaim({ id: 'claim-2', status: 'Pending' }),
          createMockClaim({ id: 'claim-3', status: 'Approved' }),
          createMockClaim({ id: 'claim-4', status: 'Denied' }),
          createMockClaim({ id: 'claim-5', status: 'Pending' }),
        ]

        useClaimsStore.getState().setClaims(claims)
        const counts = useClaimsStore.getState().getCountByStatus()

        expect(counts.Pending).toBe(3)
        expect(counts.Approved).toBe(1)
        expect(counts.Denied).toBe(1)
        expect(counts['In Review']).toBe(0)
      })

      it('should return all zeros for empty store', () => {
        const counts = useClaimsStore.getState().getCountByStatus()

        expect(counts.Pending).toBe(0)
        expect(counts.Approved).toBe(0)
        expect(counts.Denied).toBe(0)
        expect(counts['In Review']).toBe(0)
      })
    })

    describe('getTotalBilledAmount', () => {
      it('should return sum of all billed amounts', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', billedAmount: 1000 }),
          createMockClaim({ id: 'claim-2', billedAmount: 2500 }),
          createMockClaim({ id: 'claim-3', billedAmount: 750 }),
        ]

        useClaimsStore.getState().setClaims(claims)
        expect(useClaimsStore.getState().getTotalBilledAmount()).toBe(4250)
      })

      it('should return 0 for empty store', () => {
        expect(useClaimsStore.getState().getTotalBilledAmount()).toBe(0)
      })
    })

    describe('getAverageBilledAmount', () => {
      it('should return average of all billed amounts', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', billedAmount: 1000 }),
          createMockClaim({ id: 'claim-2', billedAmount: 2000 }),
          createMockClaim({ id: 'claim-3', billedAmount: 3000 }),
        ]

        useClaimsStore.getState().setClaims(claims)
        expect(useClaimsStore.getState().getAverageBilledAmount()).toBe(2000)
      })

      it('should return 0 for empty store', () => {
        expect(useClaimsStore.getState().getAverageBilledAmount()).toBe(0)
      })

      it('should handle single claim', () => {
        const claims = [createMockClaim({ id: 'claim-1', billedAmount: 1500 })]

        useClaimsStore.getState().setClaims(claims)
        expect(useClaimsStore.getState().getAverageBilledAmount()).toBe(1500)
      })
    })

    describe('getAverageDaysAged', () => {
      it('should return average of all days aged', () => {
        const claims = [
          createMockClaim({ id: 'claim-1', daysAged: 10 }),
          createMockClaim({ id: 'claim-2', daysAged: 20 }),
          createMockClaim({ id: 'claim-3', daysAged: 30 }),
        ]

        useClaimsStore.getState().setClaims(claims)
        expect(useClaimsStore.getState().getAverageDaysAged()).toBe(20)
      })

      it('should return 0 for empty store', () => {
        expect(useClaimsStore.getState().getAverageDaysAged()).toBe(0)
      })

      it('should handle single claim', () => {
        const claims = [createMockClaim({ id: 'claim-1', daysAged: 15 })]

        useClaimsStore.getState().setClaims(claims)
        expect(useClaimsStore.getState().getAverageDaysAged()).toBe(15)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largeClaims = Array.from({ length: 1000 }, (_, i) =>
        createMockClaim({
          id: `claim-${i}`,
          platform: i % 3 === 0 ? 'Facet' : i % 3 === 1 ? 'Amisys' : 'Xcelys',
          classification: i % 2 === 0 ? 'DUAL' : 'Duplicate',
          billedAmount: 1000 + i,
          daysAged: i % 100,
        })
      )

      useClaimsStore.getState().setClaims(largeClaims)
      
      expect(useClaimsStore.getState().getTotalCount()).toBe(1000)
      expect(useClaimsStore.getState().getClaimsByPlatform('Facet').length).toBeGreaterThan(0)
      expect(useClaimsStore.getState().getTotalBilledAmount()).toBeGreaterThan(0)
    })

    it('should maintain immutability when filtering', () => {
      const claims = [
        createMockClaim({ id: 'claim-1', platform: 'Facet' }),
        createMockClaim({ id: 'claim-2', platform: 'Amisys' }),
      ]

      useClaimsStore.getState().setClaims(claims)
      const originalClaims = useClaimsStore.getState().claims
      
      const filteredClaims = useClaimsStore.getState().getClaimsByPlatform('Facet')
      filteredClaims[0].status = 'Approved'

      // Original store should not be affected
      expect(useClaimsStore.getState().claims[0].status).toBe('Pending')
      expect(originalClaims).toBe(useClaimsStore.getState().claims)
    })
  })
})
