# Data Formatting Utilities

This module provides utility functions for formatting data consistently across the Claims Management UI application.

## Available Functions

### `formatCurrency(amount, options?)`

Formats a number as US currency with proper thousand separators and decimal places.

**Parameters:**
- `amount: number` - The amount to format
- `options?: { decimals?: number, showCents?: boolean }` - Optional formatting options

**Returns:** `string` - Formatted currency string (e.g., "$1,234.56")

**Examples:**
```typescript
formatCurrency(1234.56)                    // "$1,234.56"
formatCurrency(1234.567, { decimals: 2 })  // "$1,234.57"
formatCurrency(-1234.56)                   // "-$1,234.56"
formatCurrency(1234.56, { showCents: false }) // "$1,235"
```

---

### `formatDate(date, formatString?)`

Formats a date value to a readable string using date-fns.

**Parameters:**
- `date: Date | string | number` - Date object, ISO string, or timestamp
- `formatString?: string` - Optional date-fns format string (default: 'MMM d, yyyy')

**Returns:** `string` - Formatted date string or 'Invalid date' if parsing fails

**Examples:**
```typescript
formatDate(new Date('2024-01-15'))              // "Jan 15, 2024"
formatDate('2024-01-15T10:30:00Z', 'PPpp')      // "Jan 15, 2024, 10:30:00 AM"
formatDate(1705315800000)                       // "Jan 15, 2024"
formatDate('2024-01-15', 'yyyy-MM-dd')          // "2024-01-15"
```

---

### `formatRelativeDate(date, options?)`

Formats a date as relative time (e.g., "2 days ago").

**Parameters:**
- `date: Date | string | number` - Date object, ISO string, or timestamp
- `options?: { addSuffix?: boolean }` - Optional formatting options

**Returns:** `string` - Relative time string or 'Invalid date' if parsing fails

**Examples:**
```typescript
formatRelativeDate(new Date(Date.now() - 86400000))  // "1 day ago"
formatRelativeDate('2024-01-15T10:30:00Z', { addSuffix: false }) // "2 days"
```

---

### `formatConfidence(confidence, options?)`

Formats a confidence score as a percentage with clamping to 0-100 range.

**Parameters:**
- `confidence: number` - Confidence value (0-100)
- `options?: { decimals?: number }` - Optional formatting options

**Returns:** `string` - Formatted percentage string (e.g., "85.5%")

**Examples:**
```typescript
formatConfidence(85.5)                    // "85.5%"
formatConfidence(85.567, { decimals: 1 }) // "85.6%"
formatConfidence(110)                     // "100.0%" (clamped)
formatConfidence(-10)                     // "0.0%" (clamped)
```

---

### `formatPercentage(value, options?)`

Formats a percentage value.

**Parameters:**
- `value: number` - Percentage value (0-100)
- `options?: { decimals?: number }` - Optional formatting options

**Returns:** `string` - Formatted percentage string

**Examples:**
```typescript
formatPercentage(45.678)                    // "45.7%"
formatPercentage(45.678, { decimals: 2 })   // "45.68%"
```

---

### `getStatusBadge(status)`

Returns styling information for status badges based on claim status.

**Parameters:**
- `status: ClaimStatus` - Claim status ('Pending' | 'Approved' | 'Denied' | 'In Review')

**Returns:** `{ variant, text, className }` - Object with badge styling information

**Examples:**
```typescript
getStatusBadge('Approved')
// {
//   variant: 'success',
//   text: 'Approved',
//   className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
// }

getStatusBadge('Pending')
// {
//   variant: 'warning',
//   text: 'Pending',
//   className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
// }
```

**Status Mappings:**
- `Pending` → Yellow badge (warning)
- `Approved` → Green badge (success)
- `Denied` → Red badge (destructive)
- `In Review` → Blue badge (default)

---

### `formatDaysAged(days)`

Formats days aged with appropriate singular/plural unit.

**Parameters:**
- `days: number` - Number of days

**Returns:** `string` - Formatted string with unit (e.g., "5 days", "1 day")

**Examples:**
```typescript
formatDaysAged(1)    // "1 day"
formatDaysAged(5)    // "5 days"
formatDaysAged(0)    // "0 days"
```

---

### `formatNumber(value, options?)`

Formats a number with thousand separators.

**Parameters:**
- `value: number` - Number to format
- `options?: { decimals?: number }` - Optional formatting options

**Returns:** `string` - Formatted number string (e.g., "1,234")

**Examples:**
```typescript
formatNumber(1234)                      // "1,234"
formatNumber(1234.567, { decimals: 2 }) // "1,234.57"
formatNumber(1234567)                   // "1,234,567"
```

---

## Usage in Components

### Currency Display
```typescript
import { formatCurrency } from '@/lib/utils'

function ClaimAmount({ amount }: { amount: number }) {
  return <span>{formatCurrency(amount)}</span>
}
```

### Date Display
```typescript
import { formatDate, formatRelativeDate } from '@/lib/utils'

function ClaimDate({ date }: { date: Date }) {
  return (
    <div>
      <span>{formatDate(date)}</span>
      <span className="text-muted-foreground">
        {formatRelativeDate(date)}
      </span>
    </div>
  )
}
```

### Status Badge
```typescript
import { getStatusBadge } from '@/lib/utils'
import type { ClaimStatus } from '@/types'

function StatusBadge({ status }: { status: ClaimStatus }) {
  const badge = getStatusBadge(status)
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.text}
    </span>
  )
}
```

### Confidence Display
```typescript
import { formatConfidence } from '@/lib/utils'

function ConfidenceScore({ confidence }: { confidence: number }) {
  return <span>{formatConfidence(confidence)}</span>
}
```

## Testing

All utilities are thoroughly tested with unit tests. Run tests with:

```bash
npm test -- lib/utils.test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements:
- **Requirement 5.6**: BilledAmount displayed as formatted currency
- **Requirement 8.6, 8.7**: Status badges with proper theming for light and dark modes
- Data consistency across the application through centralized formatting functions
