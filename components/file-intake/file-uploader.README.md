# FileUploader Component

A drag-and-drop file uploader component for XLS/XLSX files with comprehensive validation and error handling.

## Features

- **Drag-and-Drop Interface**: Intuitive drag-and-drop zone for file selection
- **Click to Browse**: Alternative file selection via click
- **File Type Validation**: Accepts only .xls and .xlsx files
- **File Size Validation**: Enforces maximum file size (default 50MB)
- **Upload Progress**: Visual progress indicator during file parsing
- **Error Display**: Clear error messages for validation and parsing failures
- **Success Feedback**: Confirmation message with parsed claims count
- **Detailed Error Reporting**: Shows up to 10 parsing errors with row and column information
- **Keyboard Accessible**: Full keyboard navigation support
- **Theme Support**: Works seamlessly with light and dark themes
- **Screen Reader Friendly**: Proper ARIA labels and live regions

## Usage

```tsx
import { FileUploader } from '@/components/file-intake/file-uploader'
import type { FileUploadResult } from '@/types'

function MyComponent() {
  const handleUpload = (result: FileUploadResult) => {
    if (result.success) {
      console.log(`Successfully parsed ${result.claimsParsed} claims`)
      // Process the claims
      result.claims.forEach(claim => {
        // Handle each claim
      })
    } else {
      console.error('Upload failed:', result.errors)
    }
  }

  return (
    <FileUploader 
      onUpload={handleUpload}
      maxSize={52428800} // 50MB
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onUpload` | `(result: FileUploadResult) => void` | Required | Callback function called when file is uploaded and parsed |
| `maxSize` | `number` | `52428800` (50MB) | Maximum file size in bytes |
| `className` | `string` | `undefined` | Optional CSS classes for styling |

## File Upload Result

The `onUpload` callback receives a `FileUploadResult` object:

```typescript
interface FileUploadResult {
  success: boolean           // Whether parsing was successful
  claimsParsed: number       // Number of claims successfully parsed
  errors: FileParseError[]   // Array of parsing errors
  claims: Claim[]            // Array of parsed claim objects
}

interface FileParseError {
  row: number                // Row number where error occurred (0 for file-level errors)
  column?: string            // Column name where error occurred (optional)
  message: string            // Error message
  severity: 'error' | 'warning'  // Error severity
}
```

## Validation Rules

### File Type
- Only `.xls` and `.xlsx` files are accepted
- Other file types will be rejected with an error message

### File Size
- Default maximum size: 50MB (52,428,800 bytes)
- Configurable via `maxSize` prop
- Files exceeding the limit will be rejected with an error message showing both the limit and actual file size

### File Content
The component uses the XLS parser utility (`lib/xls-parser.ts`) which validates:
- Required columns: ClaimNumber, Classification, Platform, ProviderName, BilledAmount, Status, Confidence, DaysAged, State
- Data types and formats for each column
- Valid enum values for Classification, Platform, and Status fields
- Numeric ranges (e.g., Confidence must be 0-100)

## Error Handling

### Validation Errors
Displayed immediately when:
- File has invalid extension
- File exceeds maximum size

### Parsing Errors
Displayed after parsing when:
- File format is invalid
- Required columns are missing
- Data validation fails for specific rows

### Error Display
- Shows up to 10 errors in the UI
- Indicates if there are more errors beyond the displayed limit
- Each error shows row number, column name (if applicable), and error message

## Accessibility

- **Keyboard Navigation**: Full support for Enter and Space keys to trigger file selection
- **ARIA Labels**: Proper labels for screen readers
- **Live Regions**: Status updates announced to screen readers
- **Focus Management**: Clear focus indicators
- **Progress Announcements**: Upload progress communicated to assistive technologies

## Styling

The component uses Tailwind CSS classes and follows the project's design system:
- Responsive layout
- Dark mode support via Tailwind's dark mode classes
- Consistent spacing and typography
- Smooth transitions and animations

## Integration with XLS Parser

The component integrates with `lib/xls-parser.ts` which:
1. Reads the Excel file using SheetJS (xlsx library)
2. Validates required columns
3. Parses each row into a Claim object
4. Validates data types and formats
5. Returns parsed claims and any errors

## Example: Complete Integration

```tsx
'use client'

import { useState } from 'react'
import { FileUploader } from '@/components/file-intake/file-uploader'
import { ClaimsTable } from '@/components/claims-table'
import type { FileUploadResult, Claim } from '@/types'

export function FileIntakePage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null)

  const handleUpload = (result: FileUploadResult) => {
    setUploadResult(result)
    if (result.success && result.claims.length > 0) {
      setClaims(result.claims)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">File Intake</h1>
        <p className="text-muted-foreground">
          Upload an XLS or XLSX file containing claims data
        </p>
      </div>

      <FileUploader onUpload={handleUpload} />

      {claims.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Uploaded Claims ({claims.length})
          </h2>
          <ClaimsTable claims={claims} />
        </div>
      )}
    </div>
  )
}
```

## Testing

The component includes comprehensive unit tests covering:
- Rendering and accessibility
- File selection via click and keyboard
- File validation (type and size)
- Upload progress indication
- Success and error states
- File information display
- Clear functionality
- Drag and drop functionality

Run tests with:
```bash
npm test -- file-uploader.test.tsx
```

## Requirements Validation

This component validates the following requirements:
- **3.1**: Accept XLS file uploads with maximum size of 50MB
- **3.2**: Parse claims data from uploaded files
- **3.12**: Display error message for invalid file format
- **3.13**: Display error message for missing required columns

## Related Components

- `lib/xls-parser.ts` - XLS file parsing utility
- `components/claims-table.tsx` - Display parsed claims
- `components/error-display.tsx` - Error message display
- `components/loading-spinner.tsx` - Loading indicator
