# ErrorDisplay Component

A reusable component for displaying error messages in a user-friendly way throughout the Claims Management UI application.

## Features

- **Multiple Error Types**: Supports different error types with appropriate icons and colors
  - `connection`: Data source connection failures
  - `parsing`: File parsing errors
  - `network`: Network request failures
  - `validation`: Data validation errors
  - `general`: Generic errors

- **Action Buttons**: Optional retry and dismiss functionality
- **Two Display Variants**: Card (full layout) and inline (compact)
- **Theme Support**: Works seamlessly with both light and dark themes
- **Accessibility**: Proper ARIA labels, roles, and keyboard support
- **Loading States**: Shows loading indicator during retry operations

## Usage

### Basic Error Display

```tsx
import { ErrorDisplay } from '@/components/error-display'

function MyComponent() {
  return (
    <ErrorDisplay 
      type="network"
      message="Failed to fetch claims data. Please check your connection."
    />
  )
}
```

### With Retry Action

```tsx
import { ErrorDisplay } from '@/components/error-display'

function MyComponent() {
  const { refetch, isLoading } = useQuery(...)

  return (
    <ErrorDisplay 
      type="network"
      message="Failed to fetch claims data"
      onRetry={refetch}
      isRetrying={isLoading}
    />
  )
}
```

### With Detailed Error Information

```tsx
<ErrorDisplay 
  type="parsing"
  title="File Parsing Failed"
  message="The uploaded file contains invalid data"
  details="Missing required columns: ClaimNumber, BilledAmount"
  onRetry={handleRetry}
/>
```

### Inline Variant

```tsx
<ErrorDisplay 
  type="validation"
  message="BilledAmount must be a positive number"
  variant="inline"
/>
```

### With Dismiss Action

```tsx
<ErrorDisplay 
  type="general"
  message="An unexpected error occurred"
  onDismiss={() => setError(null)}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'connection' \| 'parsing' \| 'network' \| 'validation' \| 'general'` | `'general'` | The type of error to display |
| `title` | `string` | Auto-generated | Custom error title/heading |
| `message` | `string` | **Required** | The error message to display |
| `details` | `string` | - | Optional detailed error information |
| `onRetry` | `() => void` | - | Optional retry callback (shows retry button) |
| `onDismiss` | `() => void` | - | Optional dismiss callback (shows dismiss button) |
| `isRetrying` | `boolean` | `false` | Whether retry is in progress |
| `className` | `string` | - | Additional CSS classes |
| `variant` | `'card' \| 'inline'` | `'card'` | Display variant |

## Error Types

### Connection Error
Used for data source connection failures.
- **Icon**: ServerCrash
- **Default Title**: "Connection Failed"
- **Color**: Red

### Parsing Error
Used for file parsing failures.
- **Icon**: FileX
- **Default Title**: "Parsing Error"
- **Color**: Orange

### Network Error
Used for network request failures.
- **Icon**: WifiOff
- **Default Title**: "Network Error"
- **Color**: Red

### Validation Error
Used for data validation failures.
- **Icon**: AlertTriangle
- **Default Title**: "Validation Error"
- **Color**: Yellow

### General Error
Used for generic errors.
- **Icon**: AlertCircle
- **Default Title**: "Error"
- **Color**: Red

## Variants

### Card Variant (Default)
Full card layout with header, content, and footer sections. Best for prominent error displays.

```tsx
<ErrorDisplay 
  message="Error message"
  variant="card"
/>
```

### Inline Variant
Compact inline display. Best for inline error messages within forms or smaller UI sections.

```tsx
<ErrorDisplay 
  message="Error message"
  variant="inline"
/>
```

## Examples

### File Upload Error

```tsx
<ErrorDisplay 
  type="parsing"
  title="Invalid File Format"
  message="The uploaded file must be in XLS or XLSX format"
  details="Received file type: application/pdf"
  onRetry={handleFileUpload}
/>
```

### API Connection Error

```tsx
<ErrorDisplay 
  type="connection"
  message="Unable to connect to the Claims API"
  details="Connection timeout after 30 seconds"
  onRetry={reconnect}
  isRetrying={isConnecting}
/>
```

### Validation Error (Inline)

```tsx
<ErrorDisplay 
  type="validation"
  message="Please enter a valid claim number"
  variant="inline"
/>
```

### Network Error with Dismiss

```tsx
<ErrorDisplay 
  type="network"
  message="Failed to save changes"
  onRetry={handleSave}
  onDismiss={() => setShowError(false)}
/>
```

## Accessibility

The ErrorDisplay component follows accessibility best practices:

- Uses `role="alert"` for screen reader announcements
- Uses `aria-live="polite"` for non-intrusive updates
- Provides accessible labels for all interactive elements
- Icons are hidden from screen readers with `aria-hidden="true"`
- Proper keyboard navigation support
- Sufficient color contrast in both light and dark themes

## Testing

The component includes comprehensive unit tests covering:
- Basic rendering
- All error types
- Retry functionality
- Dismiss functionality
- Both variants
- Custom styling
- Edge cases
- Accessibility features

Run tests with:
```bash
npm test -- error-display.test.tsx
```

## Related Components

- `MetricsCard`: For displaying metrics with optional error states
- `LoadingSpinner`: For loading states
- `Button`: Used for retry and dismiss actions
- `Card`: Base component for card variant

## Requirements Satisfied

This component satisfies the following requirements from the Claims Management UI specification:

- **Requirement 11.1**: Display error messages for data source connection failures
- **Requirement 11.2**: Display error messages for file parsing failures
- **Requirement 11.3**: Display error messages for network request failures
- **Requirement 11.6**: Display error messages for validation failures
