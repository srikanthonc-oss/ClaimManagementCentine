# ClassificationGroup Component

A collapsible accordion component that groups claims by classification for the Pend Processing module.

## Overview

The `ClassificationGroup` component provides a clean, organized way to display claims grouped by their classification type. It features a collapsible accordion interface with the classification name and claim count in the header, and displays a filtered ClaimsTable when expanded.

## Features

- **Collapsible Accordion Interface**: Expand/collapse functionality for better organization
- **Classification Header**: Displays classification name and claim count prominently
- **Platform Filtering**: Automatically filters claims based on selected platforms
- **Integrated ClaimsTable**: Shows full claims table with sorting and search capabilities
- **Controlled Component**: Parent manages expanded state for coordinated behavior
- **Empty State Handling**: Shows helpful message when no claims match filters
- **Dark Theme Support**: Fully styled for both light and dark themes
- **Accessible**: Keyboard navigation and screen reader support

## Usage

### Basic Usage

```tsx
import { ClassificationGroup } from '@/components/pend-processing/classification-group'

function PendProcessingPage() {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const handleToggle = (classification: string) => {
    setExpandedGroups((prev) =>
      prev.includes(classification)
        ? prev.filter((c) => c !== classification)
        : [...prev, classification]
    )
  }

  return (
    <ClassificationGroup
      classification="DUAL"
      claims={dualClaims}
      expanded={expandedGroups.includes('DUAL')}
      onToggle={() => handleToggle('DUAL')}
    />
  )
}
```

### With Platform Filtering

```tsx
import { ClassificationGroup } from '@/components/pend-processing/classification-group'

function PendProcessingPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['Facet', 'Amisys'])
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['DUAL'])

  return (
    <ClassificationGroup
      classification="DUAL"
      claims={allDualClaims}
      expanded={expandedGroups.includes('DUAL')}
      onToggle={() => handleToggle('DUAL')}
      selectedPlatforms={selectedPlatforms}
    />
  )
}
```

### Multiple Groups

```tsx
import { ClassificationGroup } from '@/components/pend-processing/classification-group'

function PendProcessingPage() {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const groupedClaims = groupClaimsByClassification(claims)

  return (
    <div className="space-y-4">
      {Object.entries(groupedClaims).map(([classification, claims]) => (
        <ClassificationGroup
          key={classification}
          classification={classification}
          claims={claims}
          expanded={expandedGroups.includes(classification)}
          onToggle={() => handleToggle(classification)}
          selectedPlatforms={selectedPlatforms}
        />
      ))}
    </div>
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `classification` | `string` | Yes | The classification name for this group (e.g., "DUAL", "COB") |
| `claims` | `Claim[]` | Yes | Array of all claims in this classification |
| `expanded` | `boolean` | Yes | Whether the group is currently expanded |
| `onToggle` | `() => void` | Yes | Callback function when the group is toggled |
| `selectedPlatforms` | `Platform[]` | No | Array of selected platforms for filtering claims |
| `className` | `string` | No | Optional CSS classes for custom styling |

## Behavior

### Expand/Collapse

- The component is controlled, meaning the parent component manages the `expanded` state
- Clicking the header triggers the `onToggle` callback
- The parent decides whether to expand or collapse the group
- This allows for coordinated behavior (e.g., "expand all" or "collapse all" buttons)

### Platform Filtering

- When `selectedPlatforms` is provided and not empty, claims are filtered to only show those matching the selected platforms
- The claim count in the header reflects the filtered count
- If no claims match the filter, an empty state message is displayed
- When `selectedPlatforms` is undefined or empty, all claims are shown

### Claim Count Display

- Shows "1 claim" for singular
- Shows "X claims" for plural (including 0)
- Count updates automatically based on platform filters

## Styling

The component uses Tailwind CSS and follows the project's design system:

- **Header**: Hover effect with background color change
- **Count Badge**: Primary color with subtle background
- **Accordion**: Rounded borders with smooth transitions
- **Empty State**: Muted text color for non-intrusive messaging

### Custom Styling

You can apply custom styles using the `className` prop:

```tsx
<ClassificationGroup
  classification="DUAL"
  claims={claims}
  expanded={true}
  onToggle={handleToggle}
  className="shadow-lg"
/>
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support via Radix UI Accordion
- **Screen Readers**: Proper ARIA attributes for accordion state
- **Focus Management**: Clear focus indicators on interactive elements
- **Semantic HTML**: Uses appropriate heading levels and button elements

## Performance

- **Memoized Filtering**: Uses `React.useMemo` to optimize platform filtering
- **Virtual Scrolling**: ClaimsTable component uses virtual scrolling for large datasets
- **Efficient Re-renders**: Only re-renders when props change

## Requirements Validation

This component validates the following requirements:

- **7.1**: Groups claims by Classification value
- **7.2**: Displays a separate section for each Classification group
- **7.3**: Displays the count of claims in each Classification group
- **7.4**: Allows expanding and collapsing Classification groups
- **7.5**: When expanded, displays all claims in that Classification
- **7.6**: Applies platform filters to claims within each Classification group

## Testing

The component includes comprehensive unit tests covering:

- Header display with classification name and count
- Expand/collapse functionality
- Platform filtering logic
- Empty state handling
- Edge cases (empty arrays, special characters)
- Integration with ClaimsTable
- Accessibility features

Run tests with:

```bash
npm test -- classification-group.test.tsx
```

## Dependencies

- `@radix-ui/react-accordion`: Accessible accordion primitive
- `lucide-react`: Icon library (ChevronDown icon)
- `@/components/claims-table`: ClaimsTable component for displaying claims
- `@/components/ui/accordion`: shadcn/ui Accordion wrapper
- `@/lib/utils`: Utility functions (cn for className merging)
- `@/types`: TypeScript type definitions

## Related Components

- **ClaimsTable**: Displays the claims within each group
- **PlatformFilter**: Provides platform selection for filtering
- **PendProcessingPage**: Parent page that orchestrates multiple ClassificationGroups

## Examples

See `classification-group.example.tsx` for additional usage examples.
