# LoadingSpinner Component

A reusable loading indicator component that displays a spinning icon with optional text. Used throughout the application to show loading states for data fetching, file uploads, and other asynchronous operations.

## Features

- ✨ Smooth rotation animation
- 📏 Multiple size options (sm, default, lg)
- 📝 Optional loading text
- 🎯 Optional centering in container
- 🎨 Supports both light and dark themes
- ♿ Accessible with proper ARIA labels
- 🎭 Customizable with className prop

## Usage

### Basic Usage

```tsx
import { LoadingSpinner } from '@/components/loading-spinner'

export function MyComponent() {
  return <LoadingSpinner />
}
```

### With Loading Text

```tsx
<LoadingSpinner text="Loading claims data..." />
```

### Different Sizes

```tsx
// Small spinner
<LoadingSpinner size="sm" text="Loading..." />

// Default spinner (default)
<LoadingSpinner size="default" text="Loading..." />

// Large spinner
<LoadingSpinner size="lg" text="Loading..." />
```

### Centered in Container

```tsx
<LoadingSpinner text="Loading..." centered />
```

### Custom Styling

```tsx
<LoadingSpinner 
  text="Processing..." 
  size="lg"
  className="my-4 p-8 bg-muted rounded-lg"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `undefined` | Optional text to display below the spinner |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size of the spinner |
| `className` | `string` | `undefined` | Optional additional CSS classes |
| `centered` | `boolean` | `false` | Whether to center the spinner in its container (adds min-height) |

## Size Reference

| Size | Icon Size | Text Size | Use Case |
|------|-----------|-----------|----------|
| `sm` | 16px (h-4 w-4) | text-xs | Inline loading, small buttons |
| `default` | 24px (h-6 w-6) | text-sm | Standard loading states |
| `lg` | 32px (h-8 w-8) | text-base | Full-page loading, prominent states |

## Examples

### In a Card

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'

export function LoadingCard() {
  return (
    <Card>
      <CardContent className="py-8">
        <LoadingSpinner text="Loading data..." centered />
      </CardContent>
    </Card>
  )
}
```

### In a Button

```tsx
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/loading-spinner'

export function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button disabled={isLoading}>
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        'Submit'
      )}
    </Button>
  )
}
```

### Full Page Loading

```tsx
import { LoadingSpinner } from '@/components/loading-spinner'

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner 
        text="Loading application..." 
        size="lg" 
        centered 
      />
    </div>
  )
}
```

### Conditional Loading State

```tsx
import { LoadingSpinner } from '@/components/loading-spinner'

export function DataDisplay({ data, isLoading }: { data: any[], isLoading: boolean }) {
  if (isLoading) {
    return <LoadingSpinner text="Fetching data..." centered />
  }

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### With TanStack Query

```tsx
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner } from '@/components/loading-spinner'
import { ErrorDisplay } from '@/components/error-display'

export function ClaimsData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  })

  if (isLoading) {
    return <LoadingSpinner text="Loading claims..." centered />
  }

  if (error) {
    return <ErrorDisplay type="network" message="Failed to load claims" />
  }

  return <div>{/* Render data */}</div>
}
```

## Accessibility

The LoadingSpinner component follows accessibility best practices:

- **ARIA Attributes**: Uses `role="status"`, `aria-live="polite"`, and `aria-busy="true"`
- **Screen Reader Support**: Includes hidden text for screen readers via `.sr-only` class
- **Icon Hidden**: The spinning icon is hidden from screen readers with `aria-hidden="true"`
- **Semantic Text**: Provides meaningful loading text that describes what is loading

## Theme Support

The component automatically adapts to light and dark themes:

- Uses `text-primary` for the spinner icon (adapts to theme)
- Uses `text-muted-foreground` for the loading text (adapts to theme)
- No additional configuration needed

## Animation

The spinner uses Tailwind's `animate-spin` utility class, which provides a smooth, continuous rotation animation. The animation is hardware-accelerated for optimal performance.

## Testing

The component includes comprehensive unit tests covering:

- Basic rendering with and without text
- All size variants
- Centering behavior
- Custom styling
- Accessibility attributes
- Animation classes
- Theme support

Run tests with:

```bash
npm test loading-spinner.test.tsx
```

## Related Components

- **ErrorDisplay**: For displaying error states
- **MetricsCard**: Uses loading state with skeleton loaders
- **ClaimsTable**: Uses loading spinner for data fetching

## Requirements Satisfied

This component satisfies the following requirements from the Claims Management UI specification:

- **Requirement 12.1**: Render loading states within 2 seconds
- **Requirement 12.2**: Update display within 500ms when filtering
- **Requirement 12.3**: Display new content within 300ms when switching tabs
- **Requirement 12.4**: Apply theme changes within 500ms

## Design Decisions

1. **Lucide React Icon**: Uses `Loader2` icon for consistency with other components
2. **Flexible Sizing**: Three size options cover most use cases without being overwhelming
3. **Optional Text**: Text is optional to support both inline and standalone loading states
4. **Centered Option**: Provides easy centering without requiring wrapper divs
5. **Theme Aware**: Uses Tailwind's theme colors for automatic light/dark mode support
