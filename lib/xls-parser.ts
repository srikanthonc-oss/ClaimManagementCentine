import * as XLSX from 'xlsx'
import type { Claim, FileUploadResult, FileParseError, Classification, Platform, ClaimStatus } from '@/types'
import { isClassification, isPlatform, isClaimStatus } from './schemas'

/**
 * Generates a unique ID for a claim
 * @returns A unique identifier string
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Column mapping for XLS file parsing
 * Maps expected column names (lowercase) to claim fields
 */
const COLUMN_MAPPING: Record<string, string> = {
  claimnumber: 'claimNumber',
  classification: 'classification',
  platform: 'platform',
  providername: 'providerName',
  billedamount: 'billedAmount',
  status: 'status',
  confidence: 'confidence',
  daysaged: 'daysAged',
  state: 'state',
  holdcode: 'holdCode',
  submittype: 'submitType',
  claim_type: 'claimType',
  providerspecialty: 'providerSpecialty',
  allowedamount: 'allowedAmount',
  subscriberid: 'subscriberId',
  parflag: 'parFlag',
  form: 'form',
  recvdt: 'recvDt',
}

/**
 * Required columns that must be present in the XLS file
 * Platform is optional - will default to 'Facet' if not present
 */
const REQUIRED_COLUMNS = ['ClaimNumber', 'Classification', 'ProviderName', 'BilledAmount', 'DaysAged', 'State']

/**
 * Optional columns that enhance the data but aren't required
 */
const OPTIONAL_COLUMNS = ['Platform', 'Status', 'Confidence', 'HoldCode', 'SubmitType', 'CLAIM_TYPE', 'ProviderSpecialty', 'AllowedAmount', 'SubscriberId', 'ParFlag', 'Form', 'RecvDt']

/**
 * Parses an XLS/XLSX file and extracts claims data
 * 
 * @param file - The XLS/XLSX file to parse
 * @returns FileUploadResult containing parsed claims and any errors
 * 
 * @example
 * ```typescript
 * const file = new File([...], 'claims.xlsx')
 * const result = await parseXLSFile(file)
 * if (result.success) {
 *   console.log(`Parsed ${result.claimsParsed} claims`)
 * } else {
 *   console.error('Parsing errors:', result.errors)
 * }
 * ```
 */
export async function parseXLSFile(file: File): Promise<FileUploadResult> {
  const errors: FileParseError[] = []
  const claims: Claim[] = []

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Parse workbook
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(arrayBuffer, { type: 'array' })
    } catch (error) {
      return {
        success: false,
        claimsParsed: 0,
        errors: [
          {
            row: 0,
            message: 'Invalid file format. Please upload a valid XLS or XLSX file.',
            severity: 'error',
          },
        ],
        claims: [],
      }
    }

    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return {
        success: false,
        claimsParsed: 0,
        errors: [
          {
            row: 0,
            message: 'The file does not contain any worksheets.',
            severity: 'error',
          },
        ],
        claims: [],
      }
    }

    const worksheet = workbook.Sheets[firstSheetName]
    
    // Convert worksheet to JSON with header row
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
    
    if (rawData.length === 0) {
      return {
        success: false,
        claimsParsed: 0,
        errors: [
          {
            row: 0,
            message: 'The file is empty.',
            severity: 'error',
          },
        ],
        claims: [],
      }
    }

    // Extract header row
    const headerRow = rawData[0] as string[]
    const headers = headerRow.map((h) => String(h).trim())
    const headersLower = headers.map((h) => h.toLowerCase())

    // Validate required columns (case-insensitive)
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !headersLower.includes(col.toLowerCase())
    )
    if (missingColumns.length > 0) {
      return {
        success: false,
        claimsParsed: 0,
        errors: [
          {
            row: 0,
            message: `Missing required columns: ${missingColumns.join(', ')}`,
            severity: 'error',
          },
        ],
        claims: [],
      }
    }

    // Create column index mapping (case-insensitive)
    const columnIndices: Record<string, number> = {}
    const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]
    ALL_COLUMNS.forEach((col) => {
      const index = headersLower.indexOf(col.toLowerCase())
      if (index !== -1) {
        columnIndices[col] = index
      }
    })

    // Parse data rows (skip header)
    const dataRows = rawData.slice(1)
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNumber = i + 2 // +2 because: +1 for 1-based indexing, +1 for header row

      // Skip empty rows
      if (!row || row.length === 0 || row.every((cell) => cell === null || cell === undefined || cell === '')) {
        continue
      }

      try {
        const claimData = parseClaimRow(row, columnIndices, rowNumber, errors)
        if (claimData) {
          claims.push(claimData)
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error parsing row',
          severity: 'error',
        })
      }
    }

    // Determine success based on whether we parsed any claims
    const success = claims.length > 0 && errors.filter((e) => e.severity === 'error').length === 0

    return {
      success,
      claimsParsed: claims.length,
      errors,
      claims,
    }
  } catch (error) {
    return {
      success: false,
      claimsParsed: 0,
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : 'Unknown error parsing file',
          severity: 'error',
        },
      ],
      claims: [],
    }
  }
}

/**
 * Parses a single row of claim data
 * 
 * @param row - The row data array
 * @param columnIndices - Mapping of column names to indices
 * @param rowNumber - The row number (1-based) for error reporting
 * @param errors - Array to collect parsing errors
 * @returns Parsed Claim object or null if parsing fails
 */
function parseClaimRow(
  row: unknown[],
  columnIndices: Record<string, number>,
  rowNumber: number,
  errors: FileParseError[]
): Claim | null {
  const now = new Date()

  // Extract raw values and trim string values
  const claimNumber = getCellValue(row, columnIndices['ClaimNumber'])
  const classificationRaw = getCellValue(row, columnIndices['Classification'])
  const classification = typeof classificationRaw === 'string' ? classificationRaw.trim() : classificationRaw
  const platformRaw = columnIndices['Platform'] !== undefined ? getCellValue(row, columnIndices['Platform']) : null
  const platform = typeof platformRaw === 'string' ? platformRaw.trim() : platformRaw
  const providerName = getCellValue(row, columnIndices['ProviderName'])
  const billedAmount = getCellValue(row, columnIndices['BilledAmount'])
  const statusRaw = columnIndices['Status'] !== undefined ? getCellValue(row, columnIndices['Status']) : null
  const status = typeof statusRaw === 'string' ? statusRaw.trim() : statusRaw
  const confidence = columnIndices['Confidence'] !== undefined ? getCellValue(row, columnIndices['Confidence']) : null
  const daysAged = getCellValue(row, columnIndices['DaysAged'])
  const state = getCellValue(row, columnIndices['State'])

  // Validate required fields
  if (!claimNumber || String(claimNumber).trim() === '') {
    errors.push({
      row: rowNumber,
      column: 'ClaimNumber',
      message: 'ClaimNumber is required',
      severity: 'error',
    })
    return null
  }

  // Validate and parse classification (case-insensitive, handle combined classifications)
  const classificationStr = classification ? String(classification).trim() : ''
  const normalizedClassification = normalizeClassification(classificationStr)
  if (!normalizedClassification) {
    // Skip rows with empty/null classification silently (they have no classification assigned)
    if (!classificationStr || classificationStr === 'null' || classificationStr === 'undefined') {
      // Assign to "Other Pend" for unclassified claims
      // This allows them to still appear in the UI
    } else {
      errors.push({
        row: rowNumber,
        column: 'Classification',
        message: `Invalid Classification value: "${classification}". Must be one of: DUAL, Duplicate, COB, Pricing, Auth, Corrected Claims, High Dollar, Other Pend`,
        severity: 'warning',
      })
    }
  }

  // Validate and parse platform (optional - default to 'Facet')
  let resolvedPlatform: Platform = 'Facet'
  if (platform && String(platform).trim() !== '') {
    if (isPlatform(String(platform).trim())) {
      resolvedPlatform = String(platform).trim() as Platform
    }
    // If platform value doesn't match, just use default
  }

  // Validate provider name
  if (!providerName || String(providerName).trim() === '') {
    errors.push({
      row: rowNumber,
      column: 'ProviderName',
      message: 'ProviderName is required',
      severity: 'error',
    })
    return null
  }

  // Parse and validate billed amount (allow zero)
  const parsedBilledAmount = parseNumber(billedAmount)
  if (parsedBilledAmount === null || parsedBilledAmount < 0) {
    errors.push({
      row: rowNumber,
      column: 'BilledAmount',
      message: `Invalid BilledAmount: "${billedAmount}". Must be a non-negative number`,
      severity: 'error',
    })
    return null
  }

  // Validate and parse status (optional - default to 'Pending')
  let resolvedStatus: ClaimStatus = 'Pending'
  if (status && String(status).trim() !== '') {
    const normalizedStatus = normalizeStatus(String(status).trim())
    if (normalizedStatus) {
      resolvedStatus = normalizedStatus
    }
    // If status doesn't match, use default
  }

  // Parse and validate confidence (optional - default to 0)
  let parsedConfidence = 0
  if (confidence !== null && confidence !== undefined && String(confidence).trim() !== '') {
    // Handle percentage strings like "80%"
    const confStr = String(confidence).replace('%', '').trim()
    const confNum = parseNumber(confStr)
    if (confNum !== null && confNum >= 0) {
      // Excel stores percentages as decimals (0.8 = 80%)
      // If value is <= 1, multiply by 100 to get the actual percentage
      if (confNum > 0 && confNum <= 1) {
        parsedConfidence = Math.round(confNum * 100)
      } else if (confNum <= 100) {
        parsedConfidence = Math.round(confNum)
      }
    }
  }

  // Parse and validate days aged
  const parsedDaysAged = parseInteger(daysAged)
  if (parsedDaysAged === null || parsedDaysAged < 0) {
    errors.push({
      row: rowNumber,
      column: 'DaysAged',
      message: `Invalid DaysAged: "${daysAged}". Must be a non-negative integer`,
      severity: 'error',
    })
    return null
  }

  // Validate state
  const stateStr = String(state || '').trim().toUpperCase()
  if (stateStr.length !== 2) {
    errors.push({
      row: rowNumber,
      column: 'State',
      message: `Invalid State: "${state}". Must be a 2-character state code`,
      severity: 'error',
    })
    return null
  }

  // Extract optional fields
  const holdCodeVal = columnIndices['HoldCode'] !== undefined ? getCellValue(row, columnIndices['HoldCode']) : null
  const submitTypeVal = columnIndices['SubmitType'] !== undefined ? getCellValue(row, columnIndices['SubmitType']) : null
  const claimTypeVal = columnIndices['CLAIM_TYPE'] !== undefined ? getCellValue(row, columnIndices['CLAIM_TYPE']) : null
  const provSpecVal = columnIndices['ProviderSpecialty'] !== undefined ? getCellValue(row, columnIndices['ProviderSpecialty']) : null
  const allowedAmtVal = columnIndices['AllowedAmount'] !== undefined ? getCellValue(row, columnIndices['AllowedAmount']) : null
  const subscriberIdVal = columnIndices['SubscriberId'] !== undefined ? getCellValue(row, columnIndices['SubscriberId']) : null
  const parFlagVal = columnIndices['ParFlag'] !== undefined ? getCellValue(row, columnIndices['ParFlag']) : null
  const formVal = columnIndices['Form'] !== undefined ? getCellValue(row, columnIndices['Form']) : null
  const recvDtVal = columnIndices['RecvDt'] !== undefined ? getCellValue(row, columnIndices['RecvDt']) : null

  // Create claim object
  const claim: Claim = {
    id: generateId(),
    claimNumber: String(claimNumber).trim(),
    classification: (normalizedClassification || 'Other Pend') as Classification,
    platform: resolvedPlatform,
    providerName: String(providerName).trim(),
    billedAmount: parsedBilledAmount,
    status: resolvedStatus,
    confidence: parsedConfidence,
    daysAged: parsedDaysAged,
    state: stateStr,
    createdAt: now,
    updatedAt: now,
    // Extended fields
    holdCode: holdCodeVal ? String(holdCodeVal).trim() : undefined,
    submitType: submitTypeVal ? String(submitTypeVal).trim() : undefined,
    claimType: claimTypeVal ? String(claimTypeVal).trim() : undefined,
    providerSpecialty: provSpecVal ? String(provSpecVal).trim() : undefined,
    allowedAmount: allowedAmtVal ? parseNumber(allowedAmtVal) ?? undefined : undefined,
    subscriberId: subscriberIdVal ? String(subscriberIdVal).trim() : undefined,
    parFlag: parFlagVal ? String(parFlagVal).trim() : undefined,
    form: formVal ? String(formVal).trim() : undefined,
    recvDt: recvDtVal ? String(recvDtVal).trim() : undefined,
  }

  return claim
}

/**
 * Gets a cell value from a row by column index
 * 
 * @param row - The row data array
 * @param index - The column index
 * @returns The cell value or null if not found
 */
function getCellValue(row: unknown[], index: number): unknown {
  if (index < 0 || index >= row.length) {
    return null
  }
  const value = row[index]
  if (value === null || value === undefined) {
    return null
  }
  return value
}

/**
 * Parses a value as a number
 * 
 * @param value - The value to parse
 * @returns Parsed number or null if invalid
 */
function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,]/g, '').trim()
    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed)) {
      return parsed
    }
  }
  return null
}

/**
 * Parses a value as an integer
 * 
 * @param value - The value to parse
 * @returns Parsed integer or null if invalid
 */
function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value) && Number.isInteger(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value.trim(), 10)
    if (!isNaN(parsed)) {
      return parsed
    }
  }
  // Handle numbers that are stored as floats but represent integers
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.floor(value)
  }
  return null
}


/**
 * Normalizes a classification string to match the expected Classification type.
 * Handles case-insensitive matching and combined classifications (e.g., "COB + Duplicate" → "COB")
 * 
 * @param value - The raw classification string
 * @returns Normalized Classification value or null if no match
 */
function normalizeClassification(value: string): Classification | null {
  if (!value) return null

  const lower = value.toLowerCase().trim()

  // Direct matches (case-insensitive)
  const classificationMap: Record<string, Classification> = {
    'dual': 'DUAL',
    'duplicate': 'Duplicate',
    'cob': 'COB',
    'pricing': 'Pricing',
    'auth': 'Auth',
    'corrected claims': 'Corrected Claims',
    'corrected': 'Corrected Claims',
    'high dollar': 'High Dollar',
    'high doolar': 'High Dollar', // Handle typo in data
    'other pend': 'Other Pend',
  }

  // Try direct match first
  if (classificationMap[lower]) {
    return classificationMap[lower]
  }

  // Handle combined classifications like "COB + Duplicate", "Dual + Auth"
  // Take the first classification before the '+' or '+'
  const parts = value.split(/\s*\+\s*/)
  if (parts.length > 0) {
    const firstPart = parts[0].toLowerCase().trim()
    if (classificationMap[firstPart]) {
      return classificationMap[firstPart]
    }
  }

  // Handle variations with "Duilicate" typo
  if (lower.includes('duilicate') || lower.includes('duplicate')) {
    return 'Duplicate'
  }
  if (lower.includes('dual')) {
    return 'DUAL'
  }
  if (lower.includes('cob')) {
    return 'COB'
  }
  if (lower.includes('pricing')) {
    return 'Pricing'
  }
  if (lower.includes('auth')) {
    return 'Auth'
  }
  if (lower.includes('corrected') || lower.includes('corrrected')) {
    return 'Corrected Claims'
  }
  if (lower.includes('high dollar') || lower.includes('high doolar')) {
    return 'High Dollar'
  }
  if (lower.includes('other pend')) {
    return 'Other Pend'
  }

  return null
}

/**
 * Normalizes a status string to match the expected ClaimStatus type.
 * Handles case-insensitive matching and alternative status names.
 * 
 * @param value - The raw status string
 * @returns Normalized ClaimStatus value or null if no match
 */
function normalizeStatus(value: string): ClaimStatus | null {
  if (!value) return null

  const lower = value.toLowerCase().trim()

  const statusMap: Record<string, ClaimStatus> = {
    'pending': 'Pending',
    'approved': 'Approved',
    'denied': 'Denied',
    'in review': 'In Review',
    'in progress': 'In Review',
    'completed': 'Approved',
    'rejected': 'Denied',
  }

  return statusMap[lower] || null
}
