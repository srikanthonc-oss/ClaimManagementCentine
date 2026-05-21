# PlatformFilter Component

A multi-select filter component for filtering claims by platform (Facet, Amisys, Xcelys) in the Pend Processing module.

## Features

- **Multi-select Checkboxes**: Select one or more platforms to filter claims
- **Real-time Counts**: Displays the number of claims for each platform
- **State Management**: Integrates with Zustand UI state store for persistent selections
- **Accessibility**: Full keyboard navigation and screen reader support
- **Theme Support**: Works seamlessly with both light and dark themes

## Usage

```tsx
import { PlatformFilter } from '@/components/pend-processing/platform-filter'

export default function PendProcessingPage() {
  return (
    <div className="flex gap-4">
      <aside className="w-64">
        <PlatformFilter />
      </aside>
      <main className="flex-1">
        {/* Claims content */}
      </main>
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Optional additional CSS classes |

## State Management

The component integrates with two Zustand stores:

### UI Store (`useUIStore`)
- **`selectedPlatforms`**: Array of currently selected platforms
- **`togglePlatform(platform)`**: Toggle a platform's selection state

### Claims Store (`useClaimsStore`)
- **`getCountByPlatform()`**: Returns claim counts for each platform

## Behavior

1. **Initial State**: No platforms are selected by default
2. **Multi-select**: Users can select multiple platforms simultaneously
3. **Filtering**: When platforms are selected, only claims matching those platforms are displayed
4. **Empty Selection**: When no platforms are selected, all claims are shown
5. **Persistence**: Selected platforms are persisted to localStorage via the UI store

## Accessibility

- ✅ Proper ARIA labels for all checkboxes
- ✅ Keyboard navigation support (Tab, Space, Enter)
- ✅ Screen reader friendly with descriptive labels
- ✅ Associated labels using `htmlFor` attribute
- ✅ Focus indicators for keyboard users

## Requirements Validation

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

- ✅ 6.1: Provides filter option for Facet platform
- ✅ 6.2: Provides filter option for Amisys platform
- ✅ 6.3: Provides filter option for Xcelys platform
- ✅ 6.4: Displays only claims matching selected platform(s)
- ✅ 6.5: Allows selecting multiple platforms simultaneously
- ✅ 6.6: Displays claims matching any of the selected platforms
- ✅ 6.7: Displays the count of claims for each platform filter option

## Testing

The component includes comprehensive unit tests covering:

- ✅ Rendering all platform checkboxes
- ✅ Displaying claim counts
- ✅ Checkbox state management
- ✅ User interactions (click, keyboard)
- ✅ Multi-select functionality
- ✅ Store integration
- ✅ Accessibility features

Run tests:
```bash
npm test -- platform-filter.test.tsx
```

## Example Scenarios

### Scenario 1: Filter by Single Platform
```tsx
// User selects "Facet" checkbox
// Result: Only Facet claims are displayed
```

### Scenario 2: Filter by Multiple Platforms
```tsx
// User selects "Facet" and "Amisys" checkboxes
// Result: Claims from both Facet and Amisys are displayed
```

### Scenario 3: Clear All Filters
```tsx
// User unchecks all platforms
// Result: All claims are displayed (no filtering)
```

## Styling

The component uses shadcn/ui components with Tailwind CSS:

- **Card**: Container with border and shadow
- **Checkbox**: Radix UI checkbox with custom styling
- **Label**: Accessible label with proper cursor and hover states

### Dark Mode

The component automatically adapts to the current theme:
- Text colors adjust for readability
- Border colors match the theme
- Checkbox states are clearly visible in both themes

## Integration Example

```tsx
'use client'

import { PlatformFilter } from '@/components/pend-processing/platform-filter'
import { ClassificationGroup } from '@/components/pend-processing/classification-group'
import { useUIStore } from '@/stores/ui-store'
import { useClaimsStore } from '@/stores/claims-store'

export default function PendProcessingPage() {
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const claims = useClaimsStore((state) => state.claims)
  
  // Filter claims by selected platforms
  const filteredClaims = selectedPlatforms.length > 0
    ? claims.filter(claim => selectedPlatforms.includes(claim.platform))
    : claims

  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-6">
        <aside className="w-64 space-y-4">
          <PlatformFilter />
        </aside>
        <main className="flex-1">
          {/* Display filtered claims */}
          {filteredClaims.map(claim => (
            <div key={claim.id}>{claim.claimNumber}</div>
          ))}
        </main>
      </div>
    </div>
  )
}
```

## Related Components

- **ClassificationGroup**: Groups claims by classification in Pend Processing
- **ClaimsTable**: Displays filtered claims in a table format
- **UI Store**: Manages selected platforms state

## Notes

- The component is controlled by the UI store, making it easy to programmatically set or clear filters
- Platform counts are calculated in real-time from the claims store
- The component re-renders automatically when claims data or selections change
- Checkbox IDs are generated dynamically to ensure uniqueness
