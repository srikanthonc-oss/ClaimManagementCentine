'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface MetricsCardProps {
  /**
   * The title/label of the metric
   */
  title: string

  /**
   * The value to display (can be a number or formatted string)
   */
  value: number | string

  /**
   * Optional icon to display next to the title
   */
  icon?: React.ReactNode

  /**
   * Optional trend indicator (positive or negative percentage)
   * Positive values show an upward trend, negative values show a downward trend
   */
  trend?: number

  /**
   * Optional loading state
   */
  isLoading?: boolean

  /**
   * Optional additional CSS classes
   */
  className?: string
}

/**
 * MetricsCard Component
 * 
 * A reusable card component for displaying key metrics with optional icon and trend indicator.
 * Used on the Dashboard page to show statistics like total claims, pending claims, approval rate, etc.
 * 
 * Features:
 * - Displays title, value, and optional icon
 * - Shows trend indicator with up/down arrow and percentage
 * - Loading skeleton state
 * - Supports both light and dark themes
 * - Accessible with proper ARIA labels
 * 
 * @example
 * ```tsx
 * <MetricsCard 
 *   title="Total Claims" 
 *   value={1234} 
 *   icon={<FileText className="h-4 w-4" />}
 *   trend={5.2}
 * />
 * ```
 */
export function MetricsCard({
  title,
  value,
  icon,
  trend,
  isLoading = false,
  className,
}: MetricsCardProps) {
  // Determine trend direction and styling
  const trendDirection = trend !== undefined ? (trend >= 0 ? 'up' : 'down') : null
  const trendColor =
    trendDirection === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trendDirection === 'down'
        ? 'text-red-600 dark:text-red-400'
        : ''

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground" aria-hidden="true">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2">
            <div className="h-6 w-20 animate-pulse rounded bg-muted" />
            {trend !== undefined && (
              <div className="h-3 w-14 animate-pulse rounded bg-muted" />
            )}
          </div>
        ) : (
          <>
            {/* Main value */}
            <div className="text-lg font-bold" aria-label={`${title}: ${value}`}>
              {value}
            </div>

            {/* Trend indicator */}
            {trend !== undefined && (
              <div
                className={cn('mt-1 flex items-center gap-1 text-xs font-medium', trendColor)}
                aria-label={`Trend: ${trend >= 0 ? 'up' : 'down'} ${Math.abs(trend)}%`}
              >
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                <span>
                  {trend >= 0 ? '+' : ''}
                  {trend.toFixed(1)}%
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
