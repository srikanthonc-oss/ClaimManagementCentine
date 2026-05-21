# Dashboard Metrics Calculation Utilities

This module provides utility functions for calculating dashboard metrics from claims data. It supports aggregating claims by various dimensions (classification, platform, status) and computing financial and operational metrics.

## Overview

The metrics utilities are designed to efficiently process large arrays of claims data and generate comprehensive dashboard metrics. All functions are pure and side-effect-free, making them easy to test and reason about.

## Main Function

### `calculateDashboardMetrics(claims: Claim[]): DashboardMetrics`

The primary function that calculates all dashboard metrics in a single pass through the claims data.

**Parameters:**
- `claims`: Array of claim objects to aggregate

**Returns:** `DashboardMetrics` object containing:
- `totalClaims`: Total count of claims
- `claimsByClassification`: Record mapping each classification to its count
- `claimsByPlatform`: Record mapping each platform to its count
- `claimsByStatus`: Record mapping each status to its count
- `totalBilledAmount`: Sum of all billed amounts
- `averageBilledAmount`: Average billed amount across all claims
- `averageDaysAged`: Average days aged for pending claims only
- `lastUpdated`: Timestamp of when metrics were calculated

**Example:**
```typescript
import { calculateDashboardMetrics } from '@/lib/metrics'

const claims = [
  {
    id: '1',
    claimNumber: 'CLM-001',
    classification: 'DUAL',
    platform: 'Facet',
    status: 'Pending',
    billedAmount: 1000,
    daysAged: 10,
    // ... other fields
  },
  // ... more claims
]

const metrics = calculateDashboardMetrics(claims)
console.log(metrics.totalClaims) // 1
console.log(metrics.averageBilledAmount) // 1000
console.log(metrics.averageDaysAged) // 10
```

## Individual Calculation Functions

### Count Functions

#### `calculateTotalClaims(claims: Claim[]): number`
Returns the total number of claims.

#### `calculateClaimsByClassification(claims: Claim[]): Record<Classification, number>`
Returns a record mapping each classification to its count. All classifications are initialized to 0.

#### `calculateClaimsByPlatform(claims: Claim[]): Record<Platform, number>`
Returns a record mapping each platform to its count. All platforms are initialized to 0.

#### `calculateClaimsByStatus(claims: Claim[]): Record<ClaimStatus, number>`
Returns a record mapping each status to its count. All statuses are initialized to 0.

### Financial Metrics

#### `calculateTotalBilledAmount(claims: Claim[]): number`
Returns the sum of all billed amounts across all claims.

#### `calculateAverageBilledAmount(claims: Claim[]): number`
Returns the average billed amount across all claims. Returns 0 for empty arrays.

### Operational Metrics

#### `calculateAverageDaysAged(claims: Claim[]): number`
Returns the average days aged for **pending claims only**. Claims with other statuses are excluded from this calculation. Returns 0 if there are no pending claims.

**Important:** This function only considers claims with `status === 'Pending'`.

## Filter Functions

### `filterClaimsByPlatform(claims: Claim[], platform: Platform): Claim[]`
Filters claims to only those matching the specified platform.

### `filterClaimsByClassification(claims: Claim[], classification: Classification): Claim[]`
Filters claims to only those matching the specified classification.

### `filterClaimsByStatus(claims: Claim[], status: ClaimStatus): Claim[]`
Filters claims to only those matching the specified status.

**Example:**
```typescript
import { filterClaimsByPlatform } from '@/lib/metrics'

const facetClaims = filterClaimsByPlatform(allClaims, 'Facet')
```

## Utility Functions

### `getUniqueClassifications(claims: Claim[]): Classification[]`
Returns an array of unique classification values from the claims, sorted alphabetically.

### `getUniquePlatforms(claims: Claim[]): Platform[]`
Returns an array of unique platform values from the claims, sorted alphabetically.

### `getUniqueStatuses(claims: Claim[]): ClaimStatus[]`
Returns an array of unique status values from the claims, sorted alphabetically.

**Example:**
```typescript
import { getUniqueClassifications } from '@/lib/metrics'

const classifications = getUniqueClassifications(claims)
// Use for dynamic tab generation
classifications.forEach(classification => {
  // Create tab for each classification
})
```

## Performance Considerations

- **Single Pass Aggregation**: The main `calculateDashboardMetrics` function processes all claims in a single pass, making it efficient for large datasets.
- **Tested with 1000+ Claims**: All functions have been tested with datasets containing 1000+ claims to ensure performance.
- **Pure Functions**: All functions are pure and can be safely memoized if needed.

## Edge Cases Handled

1. **Empty Arrays**: All functions gracefully handle empty claim arrays, returning appropriate zero values or empty arrays.
2. **Zero Values**: Functions correctly handle claims with zero billed amounts or zero days aged.
3. **No Pending Claims**: `calculateAverageDaysAged` returns 0 when there are no pending claims.
4. **Missing Classifications/Platforms**: Count functions initialize all possible values to 0, even if no claims exist for that category.

## Usage in Dashboard

The metrics utilities are designed to be used in the dashboard page component:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { calculateDashboardMetrics } from '@/lib/metrics'
import MetricsCard from '@/components/metrics-card'

export default function DashboardPage() {
  const { data: claims = [] } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  })

  const metrics = calculateDashboardMetrics(claims)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsCard title="Total Claims" value={metrics.totalClaims} />
      <MetricsCard 
        title="Total Billed" 
        value={formatCurrency(metrics.totalBilledAmount)} 
      />
      <MetricsCard 
        title="Average Billed" 
        value={formatCurrency(metrics.averageBilledAmount)} 
      />
      <MetricsCard 
        title="Avg Days Aged (Pending)" 
        value={Math.round(metrics.averageDaysAged)} 
      />
    </div>
  )
}
```

## Testing

Comprehensive unit tests are available in `lib/metrics.test.ts`. Run tests with:

```bash
npm test -- lib/metrics.test.ts
```

All functions have 100% test coverage including edge cases.

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 1.1**: Calculate total count of claims across all data sources
- **Requirement 1.2**: Calculate count of claims grouped by Classification
- **Requirement 1.3**: Calculate count of claims grouped by Platform
- **Requirement 1.4**: Calculate count of claims grouped by Status
- **Requirement 1.5**: Calculate aggregate metrics for BilledAmount
- **Requirement 1.6**: Calculate average DaysAged for pending claims

## Related Files

- `types/index.ts` - Type definitions for Claim, DashboardMetrics, etc.
- `lib/schemas.ts` - Zod validation schemas
- `lib/utils.ts` - Formatting utilities (formatCurrency, etc.)
- `components/metrics-card.tsx` - UI component for displaying metrics
