'use client'

import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDebounce } from '@/hooks/use-debounce'
import { cn, formatCurrency, formatConfidence, formatDaysAged, getStatusBadge } from '@/lib/utils'
import type { Claim } from '@/types'

type SortColumn = keyof Claim | null
type SortDirection = 'asc' | 'desc' | null

interface ClaimsTableProps {
  claims: Claim[]
  className?: string
}

/**
 * ClaimsTable Component
 * 
 * A high-performance table component for displaying claims data with virtual scrolling,
 * sorting, and search capabilities. Optimized for handling 1000+ rows efficiently.
 * 
 * Features:
 * - Virtual scrolling for performance with large datasets
 * - Sortable columns with visual indicators
 * - Debounced search by claim number or provider name
 * - Formatted display for currency, confidence, and dates
 * - Status badges with color coding
 * - Loading and empty states
 * - Responsive design with horizontal scrolling
 * 
 * @param claims - Array of claim objects to display
 * @param className - Optional CSS classes for styling
 * 
 * @example
 * ```tsx
 * <ClaimsTable claims={claimsData} />
 * ```
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 12.1, 12.5**
 */
export function ClaimsTable({ claims, className }: ClaimsTableProps) {
  const [sortColumn, setSortColumn] = React.useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  
  // Debounce search query for performance (300ms as per requirements)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Reference for the scrollable container
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Filter claims based on search query
  const filteredClaims = React.useMemo(() => {
    if (!debouncedSearchQuery) return claims

    const query = debouncedSearchQuery.toLowerCase()
    return claims.filter(
      (claim) =>
        claim.claimNumber.toLowerCase().includes(query) ||
        claim.providerName.toLowerCase().includes(query)
    )
  }, [claims, debouncedSearchQuery])

  // Sort filtered claims
  const sortedClaims = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredClaims

    return [...filteredClaims].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      return 0
    })
  }, [filteredClaims, sortColumn, sortDirection])

  // Handle column header click for sorting
  const handleSort = (column: keyof Claim) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Get sort icon for column header
  const getSortIcon = (column: keyof Claim) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: sortedClaims.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated row height in pixels
    overscan: 10, // Number of items to render outside visible area
  })

  // Empty state
  if (claims.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <p className="text-muted-foreground">No claims to display</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by claim number or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredClaims.length} of {claims.length} claims
        </div>
      </div>

      {/* Table with Virtual Scrolling */}
      <div
        ref={parentRef}
        className="relative h-[500px] overflow-auto rounded-md border"
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-[140px]">
                <button
                  onClick={() => handleSort('claimNumber')}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Claim Number
                  {getSortIcon('claimNumber')}
                </button>
              </TableHead>
              <TableHead className="w-[140px]">
                <button
                  onClick={() => handleSort('classification')}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Classification
                  {getSortIcon('classification')}
                </button>
              </TableHead>
              <TableHead className="w-[100px]">
                <button
                  onClick={() => handleSort('platform')}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Platform
                  {getSortIcon('platform')}
                </button>
              </TableHead>
              <TableHead className="w-[200px]">
                <button
                  onClick={() => handleSort('providerName')}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Provider Name
                  {getSortIcon('providerName')}
                </button>
              </TableHead>
              <TableHead className="w-[130px] text-right">
                <button
                  onClick={() => handleSort('billedAmount')}
                  className="flex items-center justify-end font-medium hover:text-foreground w-full"
                >
                  Billed Amount
                  {getSortIcon('billedAmount')}
                </button>
              </TableHead>
              <TableHead className="w-[110px]">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Status
                  {getSortIcon('status')}
                </button>
              </TableHead>
              <TableHead className="w-[100px] text-right">
                <button
                  onClick={() => handleSort('confidence')}
                  className="flex items-center justify-end font-medium hover:text-foreground w-full"
                >
                  Confidence
                  {getSortIcon('confidence')}
                </button>
              </TableHead>
              <TableHead className="w-[100px] text-right">
                <button
                  onClick={() => handleSort('daysAged')}
                  className="flex items-center justify-end font-medium hover:text-foreground w-full"
                >
                  Days Aged
                  {getSortIcon('daysAged')}
                </button>
              </TableHead>
              <TableHead className="w-[70px]">
                <button
                  onClick={() => handleSort('state')}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  State
                  {getSortIcon('state')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Spacer for virtual scroll offset */}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }}>
                <td colSpan={9} />
              </tr>
            )}
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const claim = sortedClaims[virtualRow.index]
              if (!claim) return null
              const statusBadge = getStatusBadge(claim.status)

              return (
                <TableRow key={claim.id} className="text-xs">
                  <TableCell className="font-medium py-2">{claim.claimNumber}</TableCell>
                  <TableCell className="py-2">{claim.classification}</TableCell>
                  <TableCell className="py-2">{claim.platform}</TableCell>
                  <TableCell className="truncate max-w-[200px] py-2">{claim.providerName}</TableCell>
                  <TableCell className="text-right font-medium py-2">
                    {formatCurrency(claim.billedAmount)}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        statusBadge.className
                      )}
                    >
                      {statusBadge.text}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {formatConfidence(claim.confidence)}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {formatDaysAged(claim.daysAged)}
                  </TableCell>
                  <TableCell className="py-2">{claim.state}</TableCell>
                </TableRow>
              )
            })}
            {/* Bottom spacer */}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr style={{ 
                height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)}px` 
              }}>
                <td colSpan={9} />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/* No results message */}
      {filteredClaims.length === 0 && claims.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">
            No claims found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
