import { create } from 'zustand'
import type { Claim, Platform, Classification, ClaimStatus } from '@/types'

/**
 * Claims Store State Interface
 */
interface ClaimsState {
  // State
  claims: Claim[]

  // Actions
  setClaims: (claims: Claim[]) => void
  addClaims: (claims: Claim[]) => void
  clearClaims: () => void
  updateClaim: (id: string, updates: Partial<Claim>) => void

  // Selectors
  getClaimsByPlatform: (platform: Platform) => Claim[]
  getClaimsByClassification: (classification: Classification) => Claim[]
  getClaimsByStatus: (status: ClaimStatus) => Claim[]
  getClaimsByPlatforms: (platforms: Platform[]) => Claim[]

  // Computed Metrics
  getTotalCount: () => number
  getCountByClassification: () => Record<Classification, number>
  getCountByPlatform: () => Record<Platform, number>
  getCountByStatus: () => Record<ClaimStatus, number>
  getTotalBilledAmount: () => number
  getAverageBilledAmount: () => number
  getAverageDaysAged: () => number
}

/**
 * Zustand store for managing claims data
 * 
 * Provides centralized state management for claims with:
 * - CRUD operations (set, add, clear, update)
 * - Filtering by platform, classification, and status
 * - Computed metrics for dashboard and analytics
 */
export const useClaimsStore = create<ClaimsState>((set, get) => ({
  // Initial state
  claims: [],

  // Actions
  /**
   * Replace all claims with a new set
   * @param claims - Array of claims to set
   */
  setClaims: (claims: Claim[]) => {
    set({ claims })
  },

  /**
   * Add new claims to the existing set
   * Prevents duplicates by checking claim IDs
   * @param newClaims - Array of claims to add
   */
  addClaims: (newClaims: Claim[]) => {
    set((state) => {
      const existingIds = new Set(state.claims.map((c) => c.id))
      const uniqueNewClaims = newClaims.filter((c) => !existingIds.has(c.id))
      return { claims: [...state.claims, ...uniqueNewClaims] }
    })
  },

  /**
   * Clear all claims from the store
   */
  clearClaims: () => {
    set({ claims: [] })
  },

  /**
   * Update a specific claim by ID
   * @param id - The claim ID to update
   * @param updates - Partial claim object with fields to update
   */
  updateClaim: (id: string, updates: Partial<Claim>) => {
    set((state) => ({
      claims: state.claims.map((claim) =>
        claim.id === id
          ? { ...claim, ...updates, updatedAt: new Date() }
          : claim
      ),
    }))
  },

  // Selectors
  /**
   * Get all claims for a specific platform
   * @param platform - The platform to filter by
   * @returns Array of claims matching the platform (deep copy)
   */
  getClaimsByPlatform: (platform: Platform) => {
    return get().claims
      .filter((claim) => claim.platform === platform)
      .map((claim) => ({ ...claim }))
  },

  /**
   * Get all claims for a specific classification
   * @param classification - The classification to filter by
   * @returns Array of claims matching the classification (deep copy)
   */
  getClaimsByClassification: (classification: Classification) => {
    return get().claims
      .filter((claim) => claim.classification === classification)
      .map((claim) => ({ ...claim }))
  },

  /**
   * Get all claims for a specific status
   * @param status - The status to filter by
   * @returns Array of claims matching the status (deep copy)
   */
  getClaimsByStatus: (status: ClaimStatus) => {
    return get().claims
      .filter((claim) => claim.status === status)
      .map((claim) => ({ ...claim }))
  },

  /**
   * Get all claims matching any of the specified platforms
   * @param platforms - Array of platforms to filter by
   * @returns Array of claims matching any of the platforms (deep copy)
   */
  getClaimsByPlatforms: (platforms: Platform[]) => {
    if (platforms.length === 0) return get().claims.map((claim) => ({ ...claim }))
    return get().claims
      .filter((claim) => platforms.includes(claim.platform))
      .map((claim) => ({ ...claim }))
  },

  // Computed Metrics
  /**
   * Get the total count of all claims
   * @returns Total number of claims
   */
  getTotalCount: () => {
    return get().claims.length
  },

  /**
   * Get the count of claims grouped by classification
   * @returns Record mapping each classification to its count
   */
  getCountByClassification: () => {
    const claims = get().claims
    const counts: Record<Classification, number> = {
      DUAL: 0,
      Duplicate: 0,
      COB: 0,
      Pricing: 0,
      Auth: 0,
      'Corrected Claims': 0,
      'High Dollar': 0,
      'Other Pend': 0,
    }

    claims.forEach((claim) => {
      counts[claim.classification] = (counts[claim.classification] || 0) + 1
    })

    return counts
  },

  /**
   * Get the count of claims grouped by platform
   * @returns Record mapping each platform to its count
   */
  getCountByPlatform: () => {
    const claims = get().claims
    const counts: Record<Platform, number> = {
      Facet: 0,
      Amisys: 0,
      Xcelys: 0,
    }

    claims.forEach((claim) => {
      counts[claim.platform] = (counts[claim.platform] || 0) + 1
    })

    return counts
  },

  /**
   * Get the count of claims grouped by status
   * @returns Record mapping each status to its count
   */
  getCountByStatus: () => {
    const claims = get().claims
    const counts: Record<ClaimStatus, number> = {
      Pending: 0,
      Approved: 0,
      Denied: 0,
      'In Review': 0,
    }

    claims.forEach((claim) => {
      counts[claim.status] = (counts[claim.status] || 0) + 1
    })

    return counts
  },

  /**
   * Get the total billed amount across all claims
   * @returns Sum of all billed amounts
   */
  getTotalBilledAmount: () => {
    return get().claims.reduce((sum, claim) => sum + claim.billedAmount, 0)
  },

  /**
   * Get the average billed amount across all claims
   * @returns Average billed amount, or 0 if no claims
   */
  getAverageBilledAmount: () => {
    const claims = get().claims
    if (claims.length === 0) return 0
    const total = claims.reduce((sum, claim) => sum + claim.billedAmount, 0)
    return total / claims.length
  },

  /**
   * Get the average days aged across all claims
   * @returns Average days aged, or 0 if no claims
   */
  getAverageDaysAged: () => {
    const claims = get().claims
    if (claims.length === 0) return 0
    const total = claims.reduce((sum, claim) => sum + claim.daysAged, 0)
    return total / claims.length
  },
}))
