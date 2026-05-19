# MetricsCard Component

A reusable card component for displaying key metrics with optional icon and trend indicator. Used throughout the Claims Management UI application to show statistics like total claims, pending claims, approval rate, and more.

## Features

- ✅ Display title, value, and optional icon
- ✅ Show trend indicator with up/down arrow and percentage
- ✅ Loading skeleton state for async data
- ✅ Full light and dark theme support
- ✅ Accessible with proper ARIA labels
- ✅ Smooth hover animations
- ✅ Responsive design
- ✅ TypeScript support with full type safety

## Installation

The component is already included in the project. Import it from:

```tsx
import { MetricsCard } from '@/components/metrics-card'
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | The title/label of the metric |
| `value` | `number \| string` | Yes | - | The value to display (can be a number or formatted string) |
| `icon` | `React.ReactNode` | No | - | Optional icon to display next to the title |
| `trend` | `number` | No | - | Optional trend indicator (positive or negative percentage) |
| `isLoading` | `boolean` | No | `false` | Optional loading state |
| `className` | `string` | No | - | Optional additional CSS classes |

## Usage Examples

### Basic Usage

```tsx
import { MetricsCard } from '@/components/metrics-card'

export function Dashboard() {
  return <MetricsCard title="Total Claims" value={1234} />
}
```

### With Icon

```tsx
import { MetricsCard } from '@/components/metrics-card'
import { FileText } from 'lucide-react'

export function Dashboard() {
  return (
    <MetricsCard
      title="Total Claims"
      value={1234}
      icon={<FileText className="h-4 w-4" />}
    />
  )
}
```

### With Trend Indicator

```tsx
import { MetricsCard } from '@/components/metrics-card'
import { FileText } from 'lucide-react'

export function Dashboard() {
  return (
    <MetricsCard
      title="Total Claims"
      value={1234}
      icon={<FileText className="h-4 w-4" />}
      trend={5.2} // Positive trend shows green with up arrow
    />
  )
}
```

### With Negative Trend

```tsx
import { MetricsCard } from '@/components/metrics-card'
import { Clock } from 'lucide-react'

export function Dashboard() {
  return (
    <MetricsCard
      title="Pending Claims"
      value={567}
      icon={<Clock className="h-4 w-4" />}
      trend={-3.8} // Negative trend shows red with down arrow
    />
  )
}
```

### With Formatted Values

```tsx
import { MetricsCard } from '@/components/metrics-card'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function Dashboard() {
  const totalBilled = 1234567.89
  
  return (
    <MetricsCard
      title="Total Billed Amount"
      value={formatCurrency(totalBilled)} // "$1,234,567.89"
      icon={<DollarSign className="h-4 w-4" />}
      trend={12.5}
    />
  )
}
```

### Loading State

```tsx
import { MetricsCard } from '@/components/metrics-card'
import { FileText } from 'lucide-react'

export function Dashboard() {
  const { data, isLoading } = useQuery(['claims'])
  
  return (
    <MetricsCard
      title="Total Claims"
      value={data?.totalClaims ?? 0}
      icon={<FileText className="h-4 w-4" />}
      isLoading={isLoading}
    />
  )
}
```

### Dashboard Grid Layout

```tsx
import { MetricsCard } from '@/components/metrics-card'
import { FileText, Clock, CheckCircle, DollarSign } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function Dashboard() {
  const metrics = {
    totalClaims: 1234,
    pendingClaims: 567,
    approvedClaims: 456,
    totalBilled: 1234567.89,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        title="Total Claims"
        value={formatNumber(metrics.totalClaims)}
        icon={<FileText className="h-4 w-4" />}
        trend={5.2}
      />
      <MetricsCard
        title="Pending Claims"
        value={formatNumber(metrics.pendingClaims)}
        icon={<Clock className="h-4 w-4" />}
        trend={-3.8}
      />
      <MetricsCard
        title="Approved Claims"
        value={formatNumber(metrics.approvedClaims)}
        icon={<CheckCircle className="h-4 w-4" />}
        trend={8.1}
      />
      <MetricsCard
        title="Total Billed Amount"
        value={formatCurrency(metrics.totalBilled)}
        icon={<DollarSign className="h-4 w-4" />}
        trend={12.5}
      />
    </div>
  )
}
```

### Custom Styling

```tsx
import { MetricsCard } from '@/components/metrics-card'
import { AlertCircle } from 'lucide-react'

export function Dashboard() {
  return (
    <MetricsCard
      title="Priority Claims"
      value={89}
      icon={<AlertCircle className="h-4 w-4" />}
      trend={15.7}
      className="border-red-500 bg-red-50 dark:bg-red-950"
    />
  )
}
```

## Accessibility

The MetricsCard component follows accessibility best practices:

- **ARIA Labels**: The value element includes an `aria-label` that combines the title and value for screen readers
- **Trend Labels**: Trend indicators include descriptive `aria-label` attributes (e.g., "Trend: up 5.2%")
- **Decorative Icons**: Icons are marked with `aria-hidden="true"` as they are decorative
- **Keyboard Navigation**: The card is fully keyboard accessible
- **Screen Reader Support**: All content is properly announced by screen readers

## Theme Support

The component fully supports both light and dark themes:

- **Light Theme**: Uses standard colors with good contrast
- **Dark Theme**: Automatically adjusts colors using Tailwind's `dark:` variants
- **Trend Colors**: 
  - Positive trends: Green (`text-green-600 dark:text-green-400`)
  - Negative trends: Red (`text-red-600 dark:text-red-400`)
- **Smooth Transitions**: Theme changes animate smoothly with CSS transitions

## Performance

- **Lightweight**: Minimal dependencies (only uses shadcn/ui Card components)
- **Optimized Rendering**: Uses React.forwardRef for better performance
- **No Re-renders**: Pure component that only re-renders when props change
- **Loading States**: Skeleton loaders prevent layout shift during data loading

## Testing

The component includes comprehensive unit tests covering:

- ✅ Basic rendering with different value types
- ✅ Icon support
- ✅ Trend indicators (positive, negative, zero)
- ✅ Loading states
- ✅ Accessibility features
- ✅ Theme support
- ✅ Edge cases (large numbers, empty values, etc.)

Run tests with:

```bash
npm test -- metrics-card.test.tsx
```

## Related Components

- **Card**: Base card component from shadcn/ui
- **CardHeader**: Card header component
- **CardContent**: Card content component
- **CardTitle**: Card title component

## Related Utilities

- **formatCurrency**: Format numbers as currency
- **formatNumber**: Format numbers with thousand separators
- **formatConfidence**: Format confidence scores as percentages
- **cn**: Utility for merging Tailwind classes

## Requirements Satisfied

This component satisfies the following requirements from the design document:

- **Requirement 1.1**: Display total count of claims
- **Requirement 1.2**: Display count of claims grouped by Classification
- **Requirement 1.3**: Display count of claims grouped by Platform
- **Requirement 1.4**: Display count of claims grouped by Status
- **Requirement 1.5**: Display aggregate metrics for BilledAmount
- **Requirement 1.6**: Display average DaysAged for pending claims

## Browser Support

The component works in all modern browsers:

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When modifying this component:

1. Update the TypeScript types if adding new props
2. Add tests for new functionality
3. Update this README with new examples
4. Ensure accessibility is maintained
5. Test in both light and dark themes
6. Verify responsive behavior on mobile devices

## License

Part of the Claims Management UI application.
