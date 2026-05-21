import { z } from 'zod'

// ============================================================================
// Core Type Schemas
// ============================================================================

export const PlatformSchema = z.enum(['Facet', 'Amisys', 'Xcelys'])

export const ClassificationSchema = z.enum([
  'DUAL',
  'Duplicate',
  'COB',
  'Pricing',
  'Auth',
  'Corrected Claims',
  'High Dollar',
  'Other Pend',
])

export const ClaimStatusSchema = z.enum(['Pending', 'Approved', 'Denied', 'In Review'])

export const DataSourceTypeSchema = z.enum([
  'Claims API',
  'EDI Gateway',
  'File Upload',
  'FHIR API',
  'SFTP Feed',
])

// ============================================================================
// Claim Schema
// ============================================================================

export const ClaimSchema = z.object({
  id: z.string().min(1, 'Claim ID is required'),
  claimNumber: z.string().min(1, 'Claim number is required'),
  classification: ClassificationSchema,
  platform: PlatformSchema,
  providerName: z.string().min(1, 'Provider name is required'),
  billedAmount: z.number().positive('Billed amount must be a positive number'),
  status: ClaimStatusSchema,
  confidence: z
    .number()
    .min(0, 'Confidence must be at least 0')
    .max(100, 'Confidence must be at most 100'),
  daysAged: z.number().int('Days aged must be an integer').nonnegative('Days aged must be non-negative'),
  state: z.string().length(2, 'State must be a 2-character code').toUpperCase(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ============================================================================
// Data Source Config Schemas
// ============================================================================

export const ClaimsAPIConfigSchema = z.object({
  endpoint: z.string().url('Endpoint must be a valid URL'),
  apiKey: z.string().min(1, 'API key is required'),
  timeout: z.number().positive('Timeout must be positive').optional(),
})

export const EDIGatewayConfigSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int('Port must be an integer').min(1, 'Port must be at least 1').max(65535, 'Port must be at most 65535'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const FileUploadConfigSchema = z.object({
  allowedExtensions: z.array(z.string()).min(1, 'At least one allowed extension is required'),
  maxFileSize: z.number().positive('Max file size must be positive'),
})

export const FHIRAPIConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  version: z.string().min(1, 'Version is required'),
  authToken: z.string().min(1, 'Auth token is required'),
})

export const SFTPFeedConfigSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int('Port must be an integer').min(1, 'Port must be at least 1').max(65535, 'Port must be at most 65535'),
  username: z.string().min(1, 'Username is required'),
  privateKey: z.string().min(1, 'Private key is required'),
  remotePath: z.string().min(1, 'Remote path is required'),
})

export const DataSourceConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Claims API'), config: ClaimsAPIConfigSchema }),
  z.object({ type: z.literal('EDI Gateway'), config: EDIGatewayConfigSchema }),
  z.object({ type: z.literal('File Upload'), config: FileUploadConfigSchema }),
  z.object({ type: z.literal('FHIR API'), config: FHIRAPIConfigSchema }),
  z.object({ type: z.literal('SFTP Feed'), config: SFTPFeedConfigSchema }),
])

// ============================================================================
// Data Source Schema
// ============================================================================

export const DataSourceSchema = z.object({
  id: z.string().min(1, 'Data source ID is required'),
  name: z.string().min(1, 'Data source name is required'),
  type: DataSourceTypeSchema,
  config: z.union([
    ClaimsAPIConfigSchema,
    EDIGatewayConfigSchema,
    FileUploadConfigSchema,
    FHIRAPIConfigSchema,
    SFTPFeedConfigSchema,
  ]),
  status: z.enum(['active', 'inactive', 'error']),
  lastSync: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ============================================================================
// File Upload Validation Schema
// ============================================================================

export const FileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'File cannot be empty')
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must not exceed 50MB')
    .refine(
      (file) => {
        const validExtensions = ['.xls', '.xlsx']
        const fileName = file.name.toLowerCase()
        return validExtensions.some((ext) => fileName.endsWith(ext))
      },
      'File must be an XLS or XLSX file'
    ),
})

// ============================================================================
// File Parse Error Schema
// ============================================================================

export const FileParseErrorSchema = z.object({
  row: z.number().int().nonnegative(),
  column: z.string().optional(),
  message: z.string().min(1),
  severity: z.enum(['error', 'warning']),
})

// ============================================================================
// File Upload Result Schema
// ============================================================================

export const FileUploadResultSchema = z.object({
  success: z.boolean(),
  claimsParsed: z.number().int().nonnegative(),
  errors: z.array(FileParseErrorSchema),
  claims: z.array(ClaimSchema),
})

// ============================================================================
// Dashboard Metrics Schema
// ============================================================================

export const DashboardMetricsSchema = z.object({
  totalClaims: z.number().int().nonnegative(),
  claimsByClassification: z.record(ClassificationSchema, z.number().int().nonnegative()),
  claimsByPlatform: z.record(PlatformSchema, z.number().int().nonnegative()),
  claimsByStatus: z.record(ClaimStatusSchema, z.number().int().nonnegative()),
  totalBilledAmount: z.number().nonnegative(),
  averageBilledAmount: z.number().nonnegative(),
  averageDaysAged: z.number().nonnegative(),
  lastUpdated: z.date(),
})

// ============================================================================
// Validation Utility Types
// ============================================================================

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
}

// ============================================================================
// Validation Utility Functions
// ============================================================================

/**
 * Validates data against a Zod schema and returns a formatted result
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns ValidationResult with success status, data, and formatted errors
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  }
}

/**
 * Formats Zod validation errors into a more user-friendly structure
 * @param error - The Zod error object
 * @returns Array of formatted validation errors
 */
export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }))
}

/**
 * Validates a claim object
 * @param data - The claim data to validate
 * @returns ValidationResult for the claim
 */
export function validateClaim(data: unknown): ValidationResult<z.infer<typeof ClaimSchema>> {
  return validateSchema(ClaimSchema, data)
}

/**
 * Validates a data source object
 * @param data - The data source data to validate
 * @returns ValidationResult for the data source
 */
export function validateDataSource(data: unknown): ValidationResult<z.infer<typeof DataSourceSchema>> {
  return validateSchema(DataSourceSchema, data)
}

/**
 * Validates a file upload
 * @param file - The file to validate
 * @returns ValidationResult for the file upload
 */
export function validateFileUpload(file: File): ValidationResult<{ file: File }> {
  return validateSchema(FileUploadSchema, { file })
}

/**
 * Validates dashboard metrics
 * @param data - The dashboard metrics data to validate
 * @returns ValidationResult for the dashboard metrics
 */
export function validateDashboardMetrics(
  data: unknown
): ValidationResult<z.infer<typeof DashboardMetricsSchema>> {
  return validateSchema(DashboardMetricsSchema, data)
}

/**
 * Validates a data source configuration based on its type
 * @param type - The data source type
 * @param config - The configuration object to validate
 * @returns ValidationResult for the configuration
 */
export function validateDataSourceConfig(
  type: z.infer<typeof DataSourceTypeSchema>,
  config: unknown
): ValidationResult<unknown> {
  let schema: z.ZodSchema

  switch (type) {
    case 'Claims API':
      schema = ClaimsAPIConfigSchema
      break
    case 'EDI Gateway':
      schema = EDIGatewayConfigSchema
      break
    case 'File Upload':
      schema = FileUploadConfigSchema
      break
    case 'FHIR API':
      schema = FHIRAPIConfigSchema
      break
    case 'SFTP Feed':
      schema = SFTPFeedConfigSchema
      break
    default:
      return {
        success: false,
        errors: [{ path: 'type', message: 'Invalid data source type' }],
      }
  }

  return validateSchema(schema, config)
}

/**
 * Converts validation errors to a single error message string
 * @param errors - Array of validation errors
 * @returns Formatted error message string
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  if (errors.length === 1) return errors[0].message

  return errors.map((err) => `${err.path}: ${err.message}`).join('; ')
}

/**
 * Type guard to check if a value is a valid Platform
 * @param value - The value to check
 * @returns True if the value is a valid Platform
 */
export function isPlatform(value: unknown): value is z.infer<typeof PlatformSchema> {
  return PlatformSchema.safeParse(value).success
}

/**
 * Type guard to check if a value is a valid Classification
 * @param value - The value to check
 * @returns True if the value is a valid Classification
 */
export function isClassification(value: unknown): value is z.infer<typeof ClassificationSchema> {
  return ClassificationSchema.safeParse(value).success
}

/**
 * Type guard to check if a value is a valid ClaimStatus
 * @param value - The value to check
 * @returns True if the value is a valid ClaimStatus
 */
export function isClaimStatus(value: unknown): value is z.infer<typeof ClaimStatusSchema> {
  return ClaimStatusSchema.safeParse(value).success
}

/**
 * Type guard to check if a value is a valid DataSourceType
 * @param value - The value to check
 * @returns True if the value is a valid DataSourceType
 */
export function isDataSourceType(value: unknown): value is z.infer<typeof DataSourceTypeSchema> {
  return DataSourceTypeSchema.safeParse(value).success
}
