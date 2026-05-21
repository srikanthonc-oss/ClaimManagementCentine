import type { Claim, DashboardMetrics, Classification, Platform, ClaimStatus } from '@/types'

/**
 * Calculates comprehensive dashboard metrics from an array of claims
 * @param claims - Array of claim objects to aggregate
 * @returns DashboardMetrics object with all calculated metrics
 */
export function calculateDashboardMetrics(claims: Claim[]): DashboardMetrics {
  // Initialize metrics object
  const metrics: DashboardMetrics = {
    totalClaims: claims.length,
    claimsByClassification: {} as Record<Classification, number>,
    claimsByPlatform: {} as Record<Platform, number>,
    claimsByStatus: {} as Record<ClaimStatus, number>,
    totalBilledAmount: 0,
    averageBilledAmount: 0,
    averageDaysAged: 0,
    lastUpdated: new Date(),
  }

  // Handle empty claims array
  if (claims.length === 0) {
    return metrics
  }

  // Initialize classification counts
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
  classifications.forEach((classification) => {
    metrics.claimsByClassification[classification] = 0
  })

  // Initialize platform counts
  const platforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']
  platforms.forEach((platform) => {
    metrics.claimsByPlatform[platform] = 0
  })

  // Initialize status counts
  const statuses: ClaimStatus[] = ['Pending', 'Approved', 'Denied', 'In Review']
  statuses.forEach((status) => {
    metrics.claimsByStatus[status] = 0
  })

  // Aggregate metrics from claims
  let totalDaysAgedForPending = 0
  let pendingClaimsCount = 0

  claims.forEach((claim) => {
    // Count by classification
    metrics.claimsByClassification[claim.classification] =
      (metrics.claimsByClassification[claim.classification] || 0) + 1

    // Count by platform
    metrics.claimsByPlatform[claim.platform] = (metrics.claimsByPlatform[claim.platform] || 0) + 1

    // Count by status
    metrics.claimsByStatus[claim.status] = (metrics.claimsByStatus[claim.status] || 0) + 1

    // Sum billed amounts
    metrics.totalBilledAmount += claim.billedAmount

    // Sum days aged for pending claims
    if (claim.status === 'Pending') {
      totalDaysAgedForPending += claim.daysAged
      pendingClaimsCount++
    }
  })

  // Calculate average billed amount
  metrics.averageBilledAmount = metrics.totalBilledAmount / claims.length

  // Calculate average days aged for pending claims
  metrics.averageDaysAged = pendingClaimsCount > 0 ? totalDaysAgedForPending / pendingClaimsCount : 0

  return metrics
}

/**
 * Calculates the total count of claims
 * @param claims - Array of claim objects
 * @returns Total number of claims
 */
export function calculateTotalClaims(claims: Claim[]): number {
  return claims.length
}

/**
 * Calculates the count of claims grouped by classification
 * @param claims - Array of claim objects
 * @returns Record mapping each classification to its count
 */
export function calculateClaimsByClassification(claims: Claim[]): Record<Classification, number> {
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
}

/**
 * Calculates the count of claims grouped by platform
 * @param claims - Array of claim objects
 * @returns Record mapping each platform to its count
 */
export function calculateClaimsByPlatform(claims: Claim[]): Record<Platform, number> {
  const counts: Record<Platform, number> = {
    Facet: 0,
    Amisys: 0,
    Xcelys: 0,
  }

  claims.forEach((claim) => {
    counts[claim.platform] = (counts[claim.platform] || 0) + 1
  })

  return counts
}

/**
 * Calculates the count of claims grouped by status
 * @param claims - Array of claim objects
 * @returns Record mapping each status to its count
 */
export function calculateClaimsByStatus(claims: Claim[]): Record<ClaimStatus, number> {
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
}

/**
 * Calculates the total billed amount across all claims
 * @param claims - Array of claim objects
 * @returns Total billed amount
 */
export function calculateTotalBilledAmount(claims: Claim[]): number {
  return claims.reduce((total, claim) => total + claim.billedAmount, 0)
}

/**
 * Calculates the average billed amount across all claims
 * @param claims - Array of claim objects
 * @returns Average billed amount, or 0 if no claims
 */
export function calculateAverageBilledAmount(claims: Claim[]): number {
  if (claims.length === 0) return 0
  const total = calculateTotalBilledAmount(claims)
  return total / claims.length
}

/**
 * Calculates the average days aged for pending claims only
 * @param claims - Array of claim objects
 * @returns Average days aged for pending claims, or 0 if no pending claims
 */
export function calculateAverageDaysAged(claims: Claim[]): number {
  const pendingClaims = claims.filter((claim) => claim.status === 'Pending')

  if (pendingClaims.length === 0) return 0

  const totalDaysAged = pendingClaims.reduce((total, claim) => total + claim.daysAged, 0)
  return totalDaysAged / pendingClaims.length
}

/**
 * Filters claims by platform
 * @param claims - Array of claim objects
 * @param platform - Platform to filter by
 * @returns Filtered array of claims
 */
export function filterClaimsByPlatform(claims: Claim[], platform: Platform): Claim[] {
  return claims.filter((claim) => claim.platform === platform)
}

/**
 * Filters claims by classification
 * @param claims - Array of claim objects
 * @param classification - Classification to filter by
 * @returns Filtered array of claims
 */
export function filterClaimsByClassification(claims: Claim[], classification: Classification): Claim[] {
  return claims.filter((claim) => claim.classification === classification)
}

/**
 * Filters claims by status
 * @param claims - Array of claim objects
 * @param status - Status to filter by
 * @returns Filtered array of claims
 */
export function filterClaimsByStatus(claims: Claim[], status: ClaimStatus): Claim[] {
  return claims.filter((claim) => claim.status === status)
}

/**
 * Gets unique classifications from claims array
 * @param claims - Array of claim objects
 * @returns Array of unique classification values
 */
export function getUniqueClassifications(claims: Claim[]): Classification[] {
  const uniqueSet = new Set(claims.map((claim) => claim.classification))
  return Array.from(uniqueSet).sort()
}

/**
 * Gets unique platforms from claims array
 * @param claims - Array of claim objects
 * @returns Array of unique platform values
 */
export function getUniquePlatforms(claims: Claim[]): Platform[] {
  const uniqueSet = new Set(claims.map((claim) => claim.platform))
  return Array.from(uniqueSet).sort()
}

/**
 * Gets unique statuses from claims array
 * @param claims - Array of claim objects
 * @returns Array of unique status values
 */
export function getUniqueStatuses(claims: Claim[]): ClaimStatus[] {
  const uniqueSet = new Set(claims.map((claim) => claim.status))
  return Array.from(uniqueSet).sort()
}
