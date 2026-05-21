# DynamicTabs Component

A controlled tabs component that dynamically generates tabs from unique classification values with claim counts.

## Features

- **Dynamic Tab Generation**: Automatically creates tabs from unique classification values
- **Alphabetical Sorting**: Tabs are sorted alphabetically by classification name
- **Claim Counts**: Displays the number of claims in each tab label
- **Active State Highlighting**: Visual feedback for the currently selected tab
- **Performance Optimized**: Tab switching happens within 300ms with memoized rendering
- **Fully Controlled**: Manages state through `activeTab` and `onTabChange` props
- **Accessible**: Full keyboard navigation and ARIA labels for screen readers
- **Theme Support**: Works seamlessly with both light and dark themes

## Usage

```tsx
import { DynamicTabs } from '@/components/file-intake/dynamic-tabs'
import type { Classification } from '@/types'

function FileIntakePage() {
  const [activeTab, setActiveTab] = useState<Classification>('DUAL')
  
  const classifications: Classification[] = ['DUAL', 'COB', 'Pricing', 'Auth']
  const counts = {
    DUAL: 45,
    COB: 23,
    Pricing: 12,
    Auth: 8,
  }

  return (
    <DynamicTabs
      classifications={classifications}
      counts={counts}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <ClaimsTable claims={filteredClaims} />
    </DynamicTabs>
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `classifications` | `Classification[]` | Yes | Array of unique classification values to generate tabs from |
| `counts` | `Record<string, number>` | Yes | Record mapping each classification to its claim count |
| `activeTab` | `string` | Yes | Currently active tab (classification value) |
| `onTabChange` | `(classification: string) => void` | Yes | Callback when tab is changed |
| `children` | `ReactNode` | No | Content to render for the active tab |
| `className` | `string` | No | Optional CSS classes for styling |

## Examples

### Basic Usage

```tsx
<DynamicTabs
  classifications={['DUAL', 'COB', 'Pricing']}
  counts={{ DUAL: 45, COB: 23, Pricing: 12 }}
  activeTab="DUAL"
  onTabChange={(tab) => setActiveTab(tab)}
>
  <div>Tab content goes here</div>
</DynamicTabs>
```

### With Claims Table

```tsx
<DynamicTabs
  classifications={uniqueClassifications}
  counts={claimCounts}
  activeTab={selectedClassification}
  onTabChange={handleClassificationChange}
>
  <ClaimsTable 
    claims={claims.filter(c => c.classification === selectedClassification)}
    onSort={handleSort}
    onSearch={handleSearch}
  />
</DynamicTabs>
```

### With Custom Styling

```tsx
<DynamicTabs
  classifications={classifications}
  counts={counts}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  className="max-w-6xl mx-auto"
>
  <CustomContent />
</DynamicTabs>
```

## Behavior

### Tab Sorting

Tabs are automatically sorted alphabetically by classification name, regardless of the order in the `classifications` array:

```tsx
// Input: ['Pricing', 'DUAL', 'Auth', 'COB']
// Output: Auth, COB, DUAL, Pricing
```

### Missing Counts

If a classification is missing from the `counts` object, it defaults to 0:

```tsx
classifications={['DUAL', 'COB']}
counts={{ DUAL: 45 }} // COB count missing
// Result: DUAL (45), COB (0)
```

### Empty Classifications

If the `classifications` array is empty, the component renders an empty tab list:

```tsx
classifications={[]}
counts={{}}
// Result: No tabs rendered
```

## Accessibility

- **Keyboard Navigation**: Full support for arrow key navigation between tabs
- **ARIA Labels**: Each tab has a descriptive label including the claim count
- **Screen Reader Support**: Proper roles and labels for assistive technologies
- **Focus Management**: Visible focus indicators for keyboard users

## Performance

- **Memoization**: Tab triggers and sorted classifications are memoized to prevent unnecessary re-renders
- **Fast Switching**: Tab switching completes within 300ms (Requirement 12.3)
- **Optimized Rendering**: Only the active tab content is rendered

## Requirements Validation

This component validates the following requirements:

- **4.1**: Identifies all unique Classification values from claims data
- **4.2**: Creates a separate tab for each unique Classification value
- **4.3**: Displays claims within the tab corresponding to their Classification value
- **4.4**: Displays the count of claims in each tab label
- **4.5**: Displays only claims matching the selected Classification when a tab is selected
- **4.6**: Sorts tabs alphabetically by Classification name
- **4.7**: Excludes Classifications with no claims from tab creation
- **12.3**: Tab switching happens within 300ms

## Related Components

- **FileUploader**: Handles XLS file upload and parsing
- **ClaimsTable**: Displays claims data in a sortable, searchable table
- **Tabs (shadcn/ui)**: Base component from Radix UI primitives

## Notes

- This is a controlled component - you must manage the `activeTab` state
- The component uses shadcn/ui Tabs component built on Radix UI primitives
- Tab content is rendered through the `children` prop
- The component automatically handles theme switching (light/dark mode)
