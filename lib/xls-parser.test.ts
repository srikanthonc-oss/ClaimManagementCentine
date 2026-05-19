import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseXLSFile } from './xls-parser'
import type { Claim } from '@/types'

/**
 * Helper function to create a mock XLS file from data
 */
function createMockXLSFile(data: unknown[][], filename = 'test.xlsx'): File {
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return new File([buffer], filename, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * Valid claim data for testing
 */
const validClaimRow = [
  'CLM-001',
  'DUAL',
  'Facet',
  'Provider A',
  1500.50,
  'Pending',
  85,
  10,
  'CA',
]

const validHeaders = [
  'ClaimNumber',
  'Classification',
  'Platform',
  'ProviderName',
  'BilledAmount',
  'Status',
  'Confidence',
  'DaysAged',
  'State',
]

describe('parseXLSFile', () => {
  describe('Valid file parsing', () => {
    it('should successfully parse a valid XLS file with one claim', async () => {
      const file = createMockXLSFile([validHeaders, validClaimRow])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claimsParsed).toBe(1)
      expect(result.errors).toHaveLength(0)
      expect(result.claims).toHaveLength(1)

      const claim = result.claims[0]
      expect(claim.claimNumber).toBe('CLM-001')
      expect(claim.classification).toBe('DUAL')
      expect(claim.platform).toBe('Facet')
      expect(claim.providerName).toBe('Provider A')
      expect(claim.billedAmount).toBe(1500.50)
      expect(claim.status).toBe('Pending')
      expect(claim.confidence).toBe(85)
      expect(claim.daysAged).toBe(10)
      expect(claim.state).toBe('CA')
      expect(claim.id).toBeDefined()
      expect(claim.createdAt).toBeInstanceOf(Date)
      expect(claim.updatedAt).toBeInstanceOf(Date)
    })

    it('should successfully parse a valid XLS file with multiple claims', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10, 'CA'],
        ['CLM-002', 'Duplicate', 'Amisys', 'Provider B', 2000.00, 'Approved', 90, 5, 'NY'],
        ['CLM-003', 'COB', 'Xcelys', 'Provider C', 3500.75, 'Denied', 75, 20, 'TX'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claimsParsed).toBe(3)
      expect(result.errors).toHaveLength(0)
      expect(result.claims).toHaveLength(3)
      expect(result.claims[0].claimNumber).toBe('CLM-001')
      expect(result.claims[1].claimNumber).toBe('CLM-002')
      expect(result.claims[2].claimNumber).toBe('CLM-003')
    })

    it('should skip empty rows', async () => {
      const file = createMockXLSFile([
        validHeaders,
        validClaimRow,
        [], // Empty row
        ['CLM-002', 'Duplicate', 'Amisys', 'Provider B', 2000.00, 'Approved', 90, 5, 'NY'],
        [null, null, null, null, null, null, null, null, null], // Row with all nulls
        ['CLM-003', 'COB', 'Xcelys', 'Provider C', 3500.75, 'Denied', 75, 20, 'TX'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claimsParsed).toBe(3)
      expect(result.claims).toHaveLength(3)
    })

    it('should handle currency formatting in BilledAmount', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', '$1,500.50', 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claims[0].billedAmount).toBe(1500.50)
    })

    it('should normalize state codes to uppercase', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10, 'ca'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claims[0].state).toBe('CA')
    })

    it('should handle all valid classification types', async () => {
      const classifications = ['DUAL', 'Duplicate', 'COB', 'Pricing', 'Auth', 'Corrected Claims', 'High Dollar', 'Other Pend']
      const rows = classifications.map((classification, i) => [
        `CLM-00${i + 1}`,
        classification,
        'Facet',
        'Provider A',
        1500.50,
        'Pending',
        85,
        10,
        'CA',
      ])
      const file = createMockXLSFile([validHeaders, ...rows])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claimsParsed).toBe(8)
      expect(result.claims.map(c => c.classification)).toEqual(classifications)
    })

    it('should handle all valid platform types', async () => {
      const platforms = ['Facet', 'Amisys', 'Xcelys']
      const rows = platforms.map((platform, i) => [
        `CLM-00${i + 1}`,
        'DUAL',
        platform,
        'Provider A',
        1500.50,
        'Pending',
        85,
        10,
        'CA',
      ])
      const file = createMockXLSFile([validHeaders, ...rows])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claimsParsed).toBe(3)
      expect(result.claims.map(c => c.platform)).toEqual(platforms)
    })

    it('should handle all valid status types', async () => {
      const statuses = ['Pending', 'Approved', 'Denied', 'In Review']
      const rows = statuses.map((status, i) => [
        `CLM-00${i + 1}`,
        'DUAL',
        'Facet',
        'Provider A',
        1500.50,
        status,
        85,
        10,
        'CA',
      ])
      const file = createMockXLSFile([validHeaders, ...rows])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claimsParsed).toBe(4)
      expect(result.claims.map(c => c.status)).toEqual(statuses)
    })
  })

  describe('Invalid file format', () => {
    it('should return error for invalid file format', async () => {
      // Create a file with random binary data that will fail XLSX parsing
      const invalidBuffer = new Uint8Array(100).fill(0xFF)
      const file = new File([invalidBuffer], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
      // The error could be either "Invalid file format" or "Missing required columns" depending on how XLSX handles it
      const hasExpectedError = result.errors.some(e => 
        e.message.includes('Invalid file format') || 
        e.message.includes('Missing required columns') ||
        e.message.includes('empty')
      )
      expect(hasExpectedError).toBe(true)
      expect(result.errors[0].severity).toBe('error')
    })

    it('should return error for empty file', async () => {
      const file = createMockXLSFile([])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('empty')
    })

    it('should return error for file with only headers', async () => {
      const file = createMockXLSFile([validHeaders])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
    })
  })

  describe('Missing columns', () => {
    it('should return error when ClaimNumber column is missing', async () => {
      const headers = validHeaders.filter(h => h !== 'ClaimNumber')
      const file = createMockXLSFile([headers, validClaimRow.slice(1)])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Missing required columns')
      expect(result.errors[0].message).toContain('ClaimNumber')
    })

    it('should return error when multiple columns are missing', async () => {
      const headers = ['ClaimNumber', 'Classification', 'Platform']
      const file = createMockXLSFile([headers, validClaimRow.slice(0, 3)])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Missing required columns')
      expect(result.errors[0].message).toContain('ProviderName')
      expect(result.errors[0].message).toContain('BilledAmount')
    })
  })

  describe('Invalid field values', () => {
    it('should return error for missing ClaimNumber', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('ClaimNumber')
      expect(result.errors[0].message).toContain('required')
    })

    it('should return error for invalid Classification', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'InvalidType', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('Classification')
      expect(result.errors[0].message).toContain('Invalid Classification')
    })

    it('should return error for invalid Platform', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'InvalidPlatform', 'Provider A', 1500.50, 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('Platform')
      expect(result.errors[0].message).toContain('Invalid Platform')
    })

    it('should return error for missing ProviderName', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', '', 1500.50, 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('ProviderName')
      expect(result.errors[0].message).toContain('required')
    })

    it('should return error for invalid BilledAmount (negative)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', -1500.50, 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('BilledAmount')
      expect(result.errors[0].message).toContain('positive number')
    })

    it('should return error for invalid BilledAmount (zero)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 0, 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('BilledAmount')
      expect(result.errors[0].message).toContain('positive number')
    })

    it('should return error for invalid BilledAmount (non-numeric)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 'not a number', 'Pending', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('BilledAmount')
    })

    it('should return error for invalid Status', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'InvalidStatus', 85, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('Status')
      expect(result.errors[0].message).toContain('Invalid Status')
    })

    it('should return error for invalid Confidence (negative)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', -10, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('Confidence')
      expect(result.errors[0].message).toContain('between 0 and 100')
    })

    it('should return error for invalid Confidence (over 100)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 150, 10, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('Confidence')
      expect(result.errors[0].message).toContain('between 0 and 100')
    })

    it('should return error for invalid DaysAged (negative)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, -5, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('DaysAged')
      expect(result.errors[0].message).toContain('non-negative')
    })

    it('should return error for invalid State (wrong length)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10, 'CAL'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false)
      expect(result.claimsParsed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].column).toBe('State')
      expect(result.errors[0].message).toContain('2-character')
    })
  })

  describe('Partial success scenarios', () => {
    it('should parse valid rows and report errors for invalid rows', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10, 'CA'], // Valid
        ['CLM-002', 'InvalidType', 'Facet', 'Provider B', 2000.00, 'Pending', 90, 5, 'NY'], // Invalid classification
        ['CLM-003', 'COB', 'Xcelys', 'Provider C', 3500.75, 'Denied', 75, 20, 'TX'], // Valid
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(false) // Has errors
      expect(result.claimsParsed).toBe(2) // Two valid claims
      expect(result.claims).toHaveLength(2)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].row).toBe(3) // Row 3 (1-based, including header)
      expect(result.claims[0].claimNumber).toBe('CLM-001')
      expect(result.claims[1].claimNumber).toBe('CLM-003')
    })

    it('should report multiple errors with correct row numbers', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10, 'CA'], // Valid - row 2
        ['', 'DUAL', 'Facet', 'Provider B', 2000.00, 'Pending', 90, 5, 'NY'], // Invalid - row 3
        ['CLM-003', 'InvalidType', 'Xcelys', 'Provider C', 3500.75, 'Denied', 75, 20, 'TX'], // Invalid - row 4
      ])
      const result = await parseXLSFile(file)

      expect(result.claimsParsed).toBe(1)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].row).toBe(3)
      expect(result.errors[1].row).toBe(4)
    })
  })

  describe('Edge cases', () => {
    it('should handle confidence at boundary values (0 and 100)', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 0, 10, 'CA'],
        ['CLM-002', 'DUAL', 'Facet', 'Provider B', 2000.00, 'Pending', 100, 5, 'NY'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claimsParsed).toBe(2)
      expect(result.claims[0].confidence).toBe(0)
      expect(result.claims[1].confidence).toBe(100)
    })

    it('should handle daysAged at zero', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 0, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claims[0].daysAged).toBe(0)
    })

    it('should handle floating point daysAged by flooring to integer', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['CLM-001', 'DUAL', 'Facet', 'Provider A', 1500.50, 'Pending', 85, 10.7, 'CA'],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claims[0].daysAged).toBe(10)
    })

    it('should trim whitespace from string fields', async () => {
      const file = createMockXLSFile([
        validHeaders,
        ['  CLM-001  ', '  DUAL  ', '  Facet  ', '  Provider A  ', 1500.50, '  Pending  ', 85, 10, '  ca  '],
      ])
      const result = await parseXLSFile(file)

      expect(result.success).toBe(true)
      expect(result.claims[0].claimNumber).toBe('CLM-001')
      expect(result.claims[0].providerName).toBe('Provider A')
      expect(result.claims[0].state).toBe('CA')
    })
  })
})
