import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatConfidence,
  formatPercentage,
  getStatusBadge,
  formatDaysAged,
  formatNumber,
} from './utils'

describe('formatCurrency', () => {
  it('should format positive amounts correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
    expect(formatCurrency(1000)).toBe('$1,000.00')
    expect(formatCurrency(0.99)).toBe('$0.99')
  })

  it('should format negative amounts correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    expect(formatCurrency(-100)).toBe('-$100.00')
  })

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('should handle large amounts', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })

  it('should respect decimals option', () => {
    expect(formatCurrency(1234.567, { decimals: 2 })).toBe('$1,234.57')
    expect(formatCurrency(1234.567, { decimals: 3 })).toBe('$1,234.567')
    expect(formatCurrency(1234.567, { decimals: 0 })).toBe('$1,235')
  })

  it('should respect showCents option', () => {
    expect(formatCurrency(1234.56, { showCents: false })).toBe('$1,235')
    expect(formatCurrency(1234.56, { showCents: true })).toBe('$1,234.56')
  })

  it('should handle small decimal amounts', () => {
    expect(formatCurrency(0.01)).toBe('$0.01')
    expect(formatCurrency(0.001, { decimals: 3 })).toBe('$0.001')
  })
})

describe('formatDate', () => {
  it('should format Date objects correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    expect(formatDate(date)).toBe('Jan 15, 2024')
  })

  it('should format ISO strings correctly', () => {
    expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024')
    expect(formatDate('2024-12-31T23:59:59Z')).toBe('Dec 31, 2024')
  })

  it('should format timestamps correctly', () => {
    const timestamp = new Date('2024-01-15T10:30:00Z').getTime()
    expect(formatDate(timestamp)).toBe('Jan 15, 2024')
  })

  it('should handle custom format strings', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15')
    expect(formatDate(date, 'MMMM d, yyyy')).toBe('January 15, 2024')
    expect(formatDate(date, 'MM/dd/yyyy')).toBe('01/15/2024')
  })

  it('should return "Invalid date" for invalid inputs', () => {
    expect(formatDate('invalid-date')).toBe('Invalid date')
    expect(formatDate('not a date')).toBe('Invalid date')
    expect(formatDate(NaN)).toBe('Invalid date')
  })

  it('should handle edge case dates', () => {
    expect(formatDate('2024-02-29T00:00:00Z')).toBe('Feb 29, 2024') // Leap year
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('Jan 1, 2024')
    expect(formatDate('2024-12-31T23:59:59Z')).toBe('Dec 31, 2024')
  })
})

describe('formatRelativeDate', () => {
  it('should format recent dates correctly', () => {
    const now = Date.now()
    const oneDayAgo = now - 86400000 // 1 day in milliseconds
    const result = formatRelativeDate(oneDayAgo)
    expect(result).toContain('day')
    expect(result).toContain('ago')
  })

  it('should handle Date objects', () => {
    const date = new Date(Date.now() - 3600000) // 1 hour ago
    const result = formatRelativeDate(date)
    expect(result).toContain('hour')
  })

  it('should handle ISO strings', () => {
    const date = new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    const result = formatRelativeDate(date)
    expect(result).toContain('hour')
  })

  it('should respect addSuffix option', () => {
    const date = new Date(Date.now() - 86400000) // 1 day ago
    const withSuffix = formatRelativeDate(date, { addSuffix: true })
    const withoutSuffix = formatRelativeDate(date, { addSuffix: false })

    expect(withSuffix).toContain('ago')
    expect(withoutSuffix).not.toContain('ago')
  })

  it('should return "Invalid date" for invalid inputs', () => {
    expect(formatRelativeDate('invalid-date')).toBe('Invalid date')
    expect(formatRelativeDate(NaN)).toBe('Invalid date')
  })
})

describe('formatConfidence', () => {
  it('should format confidence values correctly', () => {
    expect(formatConfidence(85.5)).toBe('85.5%')
    expect(formatConfidence(100)).toBe('100.0%')
    expect(formatConfidence(0)).toBe('0.0%')
    expect(formatConfidence(50)).toBe('50.0%')
  })

  it('should respect decimals option', () => {
    expect(formatConfidence(85.567, { decimals: 0 })).toBe('86%')
    expect(formatConfidence(85.567, { decimals: 1 })).toBe('85.6%')
    expect(formatConfidence(85.567, { decimals: 2 })).toBe('85.57%')
  })

  it('should clamp values below 0', () => {
    expect(formatConfidence(-10)).toBe('0.0%')
    expect(formatConfidence(-0.1)).toBe('0.0%')
  })

  it('should clamp values above 100', () => {
    expect(formatConfidence(110)).toBe('100.0%')
    expect(formatConfidence(150)).toBe('100.0%')
  })

  it('should handle edge cases', () => {
    expect(formatConfidence(0.1)).toBe('0.1%')
    expect(formatConfidence(99.9)).toBe('99.9%')
  })
})

describe('formatPercentage', () => {
  it('should format percentage values correctly', () => {
    expect(formatPercentage(45.678)).toBe('45.7%')
    expect(formatPercentage(100)).toBe('100.0%')
    expect(formatPercentage(0)).toBe('0.0%')
  })

  it('should respect decimals option', () => {
    expect(formatPercentage(45.678, { decimals: 0 })).toBe('46%')
    expect(formatPercentage(45.678, { decimals: 1 })).toBe('45.7%')
    expect(formatPercentage(45.678, { decimals: 2 })).toBe('45.68%')
  })

  it('should handle edge cases', () => {
    expect(formatPercentage(0.1)).toBe('0.1%')
    expect(formatPercentage(99.999)).toBe('100.0%')
  })
})

describe('getStatusBadge', () => {
  it('should return correct badge for Pending status', () => {
    const badge = getStatusBadge('Pending')
    expect(badge.variant).toBe('warning')
    expect(badge.text).toBe('Pending')
    expect(badge.className).toContain('yellow')
  })

  it('should return correct badge for Approved status', () => {
    const badge = getStatusBadge('Approved')
    expect(badge.variant).toBe('success')
    expect(badge.text).toBe('Approved')
    expect(badge.className).toContain('green')
  })

  it('should return correct badge for Denied status', () => {
    const badge = getStatusBadge('Denied')
    expect(badge.variant).toBe('destructive')
    expect(badge.text).toBe('Denied')
    expect(badge.className).toContain('red')
  })

  it('should return correct badge for In Review status', () => {
    const badge = getStatusBadge('In Review')
    expect(badge.variant).toBe('default')
    expect(badge.text).toBe('In Review')
    expect(badge.className).toContain('blue')
  })

  it('should include dark mode classes', () => {
    const badge = getStatusBadge('Approved')
    expect(badge.className).toContain('dark:')
  })
})

describe('formatDaysAged', () => {
  it('should format singular day correctly', () => {
    expect(formatDaysAged(1)).toBe('1 day')
  })

  it('should format plural days correctly', () => {
    expect(formatDaysAged(0)).toBe('0 days')
    expect(formatDaysAged(2)).toBe('2 days')
    expect(formatDaysAged(5)).toBe('5 days')
    expect(formatDaysAged(100)).toBe('100 days')
  })

  it('should handle large numbers', () => {
    expect(formatDaysAged(365)).toBe('365 days')
    expect(formatDaysAged(1000)).toBe('1000 days')
  })
})

describe('formatNumber', () => {
  it('should format numbers with thousand separators', () => {
    expect(formatNumber(1234)).toBe('1,234')
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('should format numbers without decimals by default', () => {
    expect(formatNumber(1234.56)).toBe('1,235')
    expect(formatNumber(1234.4)).toBe('1,234')
  })

  it('should respect decimals option', () => {
    expect(formatNumber(1234.567, { decimals: 0 })).toBe('1,235')
    expect(formatNumber(1234.567, { decimals: 1 })).toBe('1,234.6')
    expect(formatNumber(1234.567, { decimals: 2 })).toBe('1,234.57')
  })

  it('should handle small numbers', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(1)).toBe('1')
    expect(formatNumber(99)).toBe('99')
  })

  it('should handle negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234')
    expect(formatNumber(-1234.56, { decimals: 2 })).toBe('-1,234.56')
  })
})
