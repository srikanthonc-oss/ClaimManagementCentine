import { NextRequest, NextResponse } from 'next/server'
import { generateMockClaims } from '@/lib/mock-data'
import type { Claim, Platform, Classification, ClaimStatus } from '@/types'

// Generate a stable set of mock claims for consistent API responses
const allClaims = generateMockClaims(500)

/**
 * GET /api/claims
 * Fetches claims with optional filtering and pagination.
 *
 * Query Parameters:
 * - platform: Filter by platform (Facet, Amisys, Xcelys)
 * - classification: Filter by classification (DUAL, Duplicate, COB, etc.)
 * - status: Filter by status (Pending, Approved, Denied, In Review)
 * - page: Page number (default: 1)
 * - pageSize: Number of items per page (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract filter parameters
    const platform = searchParams.get('platform') as Platform | null
    const classification = searchParams.get('classification') as Classification | null
    const status = searchParams.get('status') as ClaimStatus | null

    // Extract pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)))

    // Validate filter values
    const validPlatforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']
    const validClassifications: Classification[] = [
      'DUAL', 'Duplicate', 'COB', 'Pricing', 'Auth',
      'Corrected Claims', 'High Dollar', 'Other Pend',
    ]
    const validStatuses: ClaimStatus[] = ['Pending', 'Approved', 'Denied', 'In Review']

    if (platform && !validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform value. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      )
    }

    if (classification && !validClassifications.includes(classification)) {
      return NextResponse.json(
        { error: `Invalid classification value. Must be one of: ${validClassifications.join(', ')}` },
        { status: 400 }
      )
    }

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Apply filters
    let filteredClaims: Claim[] = allClaims

    if (platform) {
      filteredClaims = filteredClaims.filter((claim) => claim.platform === platform)
    }

    if (classification) {
      filteredClaims = filteredClaims.filter((claim) => claim.classification === classification)
    }

    if (status) {
      filteredClaims = filteredClaims.filter((claim) => claim.status === status)
    }

    // Calculate pagination
    const total = filteredClaims.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedClaims = filteredClaims.slice(startIndex, endIndex)

    return NextResponse.json({
      claims: paginatedClaims,
      total,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching claims' },
      { status: 500 }
    )
  }
}
