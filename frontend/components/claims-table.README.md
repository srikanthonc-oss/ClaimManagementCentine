# ClaimsTable Component

A high-performance table component for displaying claims data with virtual scrolling, sorting, and search capabilities. Optimized for handling 1000+ rows efficiently.

## Features

- **Virtual Scrolling**: Efficiently renders large datasets (1000+ claims) using `@tanstack/react-virtual`
- **Sortable Columns**: Click column headers to sort by any field (ascending → descending → unsorted)
- **Search Functionality**: Debounced search by claim number or provider name (300ms delay)
- **Formatted Display**: 
  - Currency formatting for billed amounts
  - Percentage formatting for confidence scores
  - Status badges with color coding
  - Days aged with proper units
- **Responsive Design**: Horizontal scrolling on smaller screens
- **Loading & Empty States**: Graceful handling of no data scenarios
- **Theme Support**: Works with both light and dark themes

## Usage

```tsx
import { ClaimsTable } from '@/components/claims-table'
import type { Claim } from '@/types'

function MyPage() {
  const claims: Claim[] = [
    // ... your claims data
  ]

  return <ClaimsTable claims={claims} />
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `claims` | `Claim[]` | Yes | Array of claim objects to display |
| `className` | `string` | No | Optional CSS classes for styling |

## Claim Interface

```typescript
interface Claim {
  id: string
  claimNumber: string
  classification: Classification
  platform: Platform
  providerName: string
  billedAmount: number
  status: ClaimStatus
  confidence: number // 0-100
  daysAged: number
  state: string // US state code
  createdAt: Date
  updatedAt: Date
}
```

## Columns

The table displays the following columns:

1. **Claim Number**: Unique identifier for the claim
2. **Classification**: Category (DUAL, Duplicate, COB, Pricing, Auth, etc.)
3. **Platform**: Processing system (Facet, Amisys, Xcelys)
4. **Provider Name**: Healthcare provider name
5. **Billed Amount**: Formatted as US currency ($1,234.56)
6. **Status**: Badge with color coding (Pending, Approved, Denied, In Review)
7. **Confidence**: Percentage score (0-100%)
8. **Days Aged**: Number of days since creation
9. **State**: US state code

## Sorting

Click any column header to sort:
- **First click**: Sort ascending
- **Second click**: Sort descending
- **Third click**: Clear sorting (return to original order)

Visual indicators show the current sort state:
- ↕️ Unsorted
- ↑ Ascending
- ↓ Descending

## Search

The search input filters claims by:
- Claim number (e.g., "CLM-001")
- Provider name (e.g., "Dr. Smith")

Search is:
- **Case-insensitive**: "smith" matches "Dr. Smith"
- **Debounced**: 300ms delay to avoid excessive filtering
- **Real-time**: Results update as you type

## Performance

The component is optimized for large datasets:

- **Virtual Scrolling**: Only renders visible rows + overscan buffer
- **Memoization**: Filtered and sorted results are cached
- **Debouncing**: Search input is debounced to reduce computations
- **Estimated Row Height**: 57px for consistent scrolling

### Performance Benchmarks

- **1000 claims**: Renders in < 2 seconds
- **Filtering**: Updates in < 500ms
- **Sorting**: Updates in < 500ms

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper labels for screen readers
- **Focus Management**: Clear focus indicators
- **Semantic HTML**: Uses proper table elements

## Examples

### Basic Usage

```tsx
<ClaimsTable claims={claimsData} />
```

### With Custom Styling

```tsx
<ClaimsTable 
  claims={claimsData} 
  className="my-custom-class" 
/>
```

### Empty State

When no claims are provided, the component displays:
```
No claims to display
```

### No Search Results

When search has no matches:
```
No claims found matching "search query"
```

## Dependencies

- `@tanstack/react-virtual`: Virtual scrolling
- `lucide-react`: Icons (Search, ArrowUpDown, ArrowUp, ArrowDown)
- `@/components/ui/input`: Search input component
- `@/components/ui/table`: Table components
- `@/hooks/use-debounce`: Debounce hook
- `@/lib/utils`: Formatting utilities

## Testing

The component has comprehensive test coverage:

- ✅ Rendering all columns and data
- ✅ Formatted currency, confidence, and status
- ✅ Search by claim number and provider name
- ✅ Case-insensitive search
- ✅ Sorting by all columns (asc/desc/clear)
- ✅ Combined search and sort
- ✅ Empty states
- ✅ Large dataset performance (1000+ claims)
- ✅ Accessibility features

Run tests:
```bash
npm test -- claims-table.test.tsx
```

## Requirements Validation

This component validates the following requirements:

- **5.1-5.10**: Display all claim attributes in tabular format
- **5.11**: Support sorting by any column
- **5.12**: Support searching by claim number or provider name
- **12.1**: Render 1000+ claims within 2 seconds
- **12.5**: Implement virtual scrolling for tables with 100+ rows
- **12.6**: Debounce search input with 300ms delay

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Known Limitations

- Virtual scrolling requires a fixed container height (currently 600px)
- Search only filters by claim number and provider name (not other fields)
- Sorting is client-side only (not suitable for server-side pagination)

## Future Enhancements

- [ ] Column visibility toggle
- [ ] Export to CSV/Excel
- [ ] Row selection with bulk actions
- [ ] Advanced filtering (date ranges, multi-select)
- [ ] Server-side sorting and pagination
- [ ] Customizable column widths
- [ ] Sticky column headers during horizontal scroll
