# Zod Validation Schemas

This file contains comprehensive Zod validation schemas for the Claims Management UI application.

## Overview

The schemas provide runtime validation with TypeScript type inference for all core data models in the application.

## Available Schemas

### Core Type Schemas
- `PlatformSchema` - Validates platform values (Facet, Amisys, Xcelys)
- `ClassificationSchema` - Validates claim classifications
- `ClaimStatusSchema` - Validates claim status values
- `DataSourceTypeSchema` - Validates data source types

### Data Model Schemas
- `ClaimSchema` - Validates claim objects with all required fields and validation rules
- `DataSourceSchema` - Validates data source configurations
- `FileUploadSchema` - Validates file uploads (XLS/XLSX, max 50MB)
- `FileUploadResultSchema` - Validates file parsing results
- `DashboardMetricsSchema` - Validates dashboard metrics data

### Data Source Config Schemas
- `ClaimsAPIConfigSchema` - Validates Claims API configuration
- `EDIGatewayConfigSchema` - Validates EDI Gateway configuration
- `FileUploadConfigSchema` - Validates File Upload configuration
- `FHIRAPIConfigSchema` - Validates FHIR API configuration
- `SFTPFeedConfigSchema` - Validates SFTP Feed configuration

## Validation Rules

### Claim Validation
- `billedAmount` - Must be a positive number (> 0)
- `daysAged` - Must be a non-negative integer (>= 0)
- `confidence` - Must be between 0 and 100 (inclusive)
- `state` - Must be a 2-character code (automatically converted to uppercase)

### File Upload Validation
- File must be XLS or XLSX format
- File size must not exceed 50MB
- File cannot be empty

### Data Source Config Validation
- URLs must be valid
- Ports must be between 1 and 65535
- Required fields must not be empty

## Usage Examples

### Basic Validation

```typescript
import { ClaimSchema, validateClaim } from '@/lib/schemas'

// Using Zod directly
const result = ClaimSchema.safeParse(claimData)
if (result.success) {
  console.log('Valid claim:', result.data)
} else {
  console.error('Validation errors:', result.error)
}

// Using utility function
const validation = validateClaim(claimData)
if (validation.success) {
  console.log('Valid claim:', validation.data)
} else {
  console.error('Errors:', validation.errors)
}
```

### File Upload Validation

```typescript
import { validateFileUpload, formatValidationErrors } from '@/lib/schemas'

const handleFileUpload = (file: File) => {
  const validation = validateFileUpload(file)
  
  if (!validation.success) {
    const errorMessage = formatValidationErrors(validation.errors!)
    alert(errorMessage)
    return
  }
  
  // Proceed with file upload
  uploadFile(file)
}
```

### Data Source Config Validation

```typescript
import { validateDataSourceConfig } from '@/lib/schemas'

const handleSaveDataSource = (type: DataSourceType, config: unknown) => {
  const validation = validateDataSourceConfig(type, config)
  
  if (!validation.success) {
    setErrors(validation.errors!)
    return
  }
  
  // Save the validated config
  saveDataSource(validation.data)
}
```

### Type Guards

```typescript
import { isPlatform, isClassification } from '@/lib/schemas'

const value = getUserInput()

if (isPlatform(value)) {
  // TypeScript knows value is Platform type here
  filterByPlatform(value)
}

if (isClassification(value)) {
  // TypeScript knows value is Classification type here
  filterByClassification(value)
}
```

### Error Formatting

```typescript
import { formatValidationErrors } from '@/lib/schemas'

const validation = validateClaim(data)

if (!validation.success) {
  // Single error message
  const message = formatValidationErrors(validation.errors!)
  
  // Or display individual errors
  validation.errors!.forEach(error => {
    console.log(`${error.path}: ${error.message}`)
  })
}
```

## Utility Functions

### `validateSchema<T>(schema, data)`
Generic validation function that works with any Zod schema.

### `validateClaim(data)`
Validates a claim object.

### `validateDataSource(data)`
Validates a data source object.

### `validateFileUpload(file)`
Validates a file upload.

### `validateDashboardMetrics(data)`
Validates dashboard metrics data.

### `validateDataSourceConfig(type, config)`
Validates a data source configuration based on its type.

### `formatZodErrors(error)`
Converts Zod errors to a user-friendly format.

### `formatValidationErrors(errors)`
Converts validation errors to a single error message string.

### Type Guards
- `isPlatform(value)` - Checks if value is a valid Platform
- `isClassification(value)` - Checks if value is a valid Classification
- `isClaimStatus(value)` - Checks if value is a valid ClaimStatus
- `isDataSourceType(value)` - Checks if value is a valid DataSourceType

## TypeScript Integration

All schemas automatically infer TypeScript types:

```typescript
import { z } from 'zod'
import { ClaimSchema, PlatformSchema } from '@/lib/schemas'

// Infer types from schemas
type Claim = z.infer<typeof ClaimSchema>
type Platform = z.infer<typeof PlatformSchema>
```

## Testing

Comprehensive unit tests are available in `schemas.test.ts` covering:
- Valid data validation
- Invalid data rejection
- Boundary conditions
- Error message formatting
- Type guards
- Utility functions

Run tests with:
```bash
npm test
```
