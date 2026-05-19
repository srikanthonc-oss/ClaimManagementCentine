import type { Claim, Classification, Platform, ClaimStatus } from '@/types'

/**
 * Generate mock claims data for development and testing
 * @param count - Number of claims to generate
 * @returns Array of mock claim objects
 */
export function generateMockClaims(count: number = 100): Claim[] {
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

  const statuses: ClaimStatus[] = ['Pending', 'Approved', 'Denied', 'In Review']

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ]

  const providerNames = [
    'Memorial Hospital',
    'City Medical Center',
    'Regional Health System',
    'Community Clinic',
    'University Hospital',
    'St. Mary\'s Medical',
    'General Hospital',
    'Family Health Center',
    'Specialty Care Associates',
    'Primary Care Physicians',
    'Emergency Medical Services',
    'Surgical Center',
    'Diagnostic Imaging',
    'Rehabilitation Services',
    'Urgent Care Clinic',
  ]

  const claims: Claim[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Updated within 7 days of creation

    claims.push({
      id: `claim-${i + 1}`,
      claimNumber: `CLM${String(100000 + i).padStart(6, '0')}`,
      classification: classifications[Math.floor(Math.random() * classifications.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      providerName: providerNames[Math.floor(Math.random() * providerNames.length)],
      billedAmount: Math.floor(Math.random() * 50000) + 500, // $500 - $50,500
      status: statuses[Math.floor(Math.random() * statuses.length)],
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100
      daysAged: Math.floor(Math.random() * 90), // 0-90 days
      state: states[Math.floor(Math.random() * states.length)],
      createdAt,
      updatedAt,
    })
  }

  return claims
}

/**
 * Get a single mock claim by ID
 * @param id - Claim ID
 * @returns Mock claim object or undefined
 */
export function getMockClaimById(id: string): Claim | undefined {
  const claims = generateMockClaims(100)
  return claims.find((claim) => claim.id === id)
}

/**
 * Generate mock claims with specific characteristics for testing
 * @param overrides - Partial claim properties to override
 * @param count - Number of claims to generate
 * @returns Array of mock claim objects with overrides applied
 */
export function generateMockClaimsWithOverrides(
  overrides: Partial<Claim>,
  count: number = 10
): Claim[] {
  const baseClaims = generateMockClaims(count)
  return baseClaims.map((claim) => ({ ...claim, ...overrides }))
}
