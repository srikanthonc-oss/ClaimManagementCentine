import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import type { ClaimStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as US currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "$1,234.56")
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.567, { decimals: 2 }) // "$1,234.57"
 * formatCurrency(-1234.56) // "-$1,234.56"
 */
export function formatCurrency(
  amount: number,
  options?: {
    decimals?: number
    showCents?: boolean
  }
): string {
  const { decimals = 2, showCents = true } = options || {}

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? decimals : 0,
    maximumFractionDigits: showCents ? decimals : 0,
  })

  return formatter.format(amount)
}

/**
 * Format a date value to a readable string
 * @param date - Date object, ISO string, or timestamp
 * @param formatString - Optional date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string or 'Invalid date' if parsing fails
 * @example
 * formatDate(new Date('2024-01-15')) // "Jan 15, 2024"
 * formatDate('2024-01-15T10:30:00Z', 'PPpp') // "Jan 15, 2024, 10:30:00 AM"
 * formatDate(1705315800000) // "Jan 15, 2024"
 */
export function formatDate(
  date: Date | string | number,
  formatString: string = 'MMM d, yyyy'
): string {
  try {
    let dateObj: Date

    if (typeof date === 'string') {
      dateObj = parseISO(date)
    } else if (typeof date === 'number') {
      dateObj = new Date(date)
    } else {
      dateObj = date
    }

    if (!isValid(dateObj)) {
      return 'Invalid date'
    }

    return format(dateObj, formatString)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 * @param date - Date object, ISO string, or timestamp
 * @param options - Optional formatting options
 * @returns Relative time string or 'Invalid date' if parsing fails
 * @example
 * formatRelativeDate(new Date(Date.now() - 86400000)) // "1 day ago"
 * formatRelativeDate('2024-01-15T10:30:00Z', { addSuffix: false }) // "2 days"
 */
export function formatRelativeDate(
  date: Date | string | number,
  options?: {
    addSuffix?: boolean
  }
): string {
  try {
    let dateObj: Date

    if (typeof date === 'string') {
      dateObj = parseISO(date)
    } else if (typeof date === 'number') {
      dateObj = new Date(date)
    } else {
      dateObj = date
    }

    if (!isValid(dateObj)) {
      return 'Invalid date'
    }

    return formatDistanceToNow(dateObj, {
      addSuffix: options?.addSuffix ?? true,
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format a confidence score as a percentage
 * @param confidence - Confidence value (0-100)
 * @param options - Optional formatting options
 * @returns Formatted percentage string (e.g., "85.5%")
 * @example
 * formatConfidence(85.5) // "85.5%"
 * formatConfidence(85.567, { decimals: 1 }) // "85.6%"
 * formatConfidence(100) // "100%"
 */
export function formatConfidence(
  confidence: number,
  options?: {
    decimals?: number
  }
): string {
  const { decimals = 1 } = options || {}

  // Clamp confidence between 0 and 100
  const clampedConfidence = Math.max(0, Math.min(100, confidence))

  return `${clampedConfidence.toFixed(decimals)}%`
}

/**
 * Format a percentage value
 * @param value - Percentage value (0-100)
 * @param options - Optional formatting options
 * @returns Formatted percentage string
 * @example
 * formatPercentage(45.678) // "45.7%"
 * formatPercentage(45.678, { decimals: 2 }) // "45.68%"
 */
export function formatPercentage(
  value: number,
  options?: {
    decimals?: number
  }
): string {
  const { decimals = 1 } = options || {}
  return `${value.toFixed(decimals)}%`
}

/**
 * Get status badge styling based on claim status
 * @param status - Claim status
 * @returns Object with CSS classes and display text
 * @example
 * getStatusBadge('Approved') // { variant: 'success', text: 'Approved', className: '...' }
 */
export function getStatusBadge(status: ClaimStatus): {
  variant: 'default' | 'success' | 'warning' | 'destructive'
  text: string
  className: string
} {
  const statusMap: Record<
    ClaimStatus,
    {
      variant: 'default' | 'success' | 'warning' | 'destructive'
      text: string
      className: string
    }
  > = {
    Pending: {
      variant: 'warning',
      text: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    Approved: {
      variant: 'success',
      text: 'Approved',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    Denied: {
      variant: 'destructive',
      text: 'Denied',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    'In Review': {
      variant: 'default',
      text: 'In Review',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
  }

  return statusMap[status] || statusMap.Pending
}

/**
 * Format days aged with appropriate unit
 * @param days - Number of days
 * @returns Formatted string with unit (e.g., "5 days", "1 day")
 * @example
 * formatDaysAged(1) // "1 day"
 * formatDaysAged(5) // "5 days"
 * formatDaysAged(0) // "0 days"
 */
export function formatDaysAged(days: number): string {
  if (days === 1) {
    return '1 day'
  }
  return `${days} days`
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @param options - Optional formatting options
 * @returns Formatted number string (e.g., "1,234")
 * @example
 * formatNumber(1234) // "1,234"
 * formatNumber(1234.567, { decimals: 2 }) // "1,234.57"
 */
export function formatNumber(
  value: number,
  options?: {
    decimals?: number
  }
): string {
  const { decimals = 0 } = options || {}

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
