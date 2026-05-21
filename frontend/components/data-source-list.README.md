# DataSourceList Component

A table component for displaying all configured data sources with edit and delete actions. Used in the Data Sources Management page to show data source configurations including name, type, status, and last sync time.

## Features

- ✅ Table display with all data source information
- ✅ Status indicators with color coding (active, inactive, error)
- ✅ Edit and Delete action buttons for each data source
- ✅ Last sync time displayed as relative time
- ✅ Empty state when no data sources exist
- ✅ Responsive design with horizontal scrolling on mobile
- ✅ Full light and dark theme support
- ✅ Accessible with proper ARIA labels
- ✅ TypeScript support with full type safety

## Installation

The component is already included in the project. Import it from:

```tsx
import { DataSourceList } from '@/components/data-source-list'
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `dataSources` | `DataSource[]` | Yes | - | Array of data source objects to display |
| `onEdit` | `(id: string) => void` | Yes | - | Callback function when edit button is clicked, receives data source ID |
| `onDelete` | `(id: string) => void` | Yes | - | Callback function when delete button is clicked, receives data source ID |
| `className` | `string` | No | - | Optional additional CSS classes |

## DataSource Type

```typescript
interface DataSource {
  id: string
  name: string
  type: DataSourceType
  config: DataSourceConfig
  status: 'active' | 'inactive' | 'error'
  lastSync?: Date
  createdAt: Date
  updatedAt: Date
}

type DataSourceType = 
  | 'Claims API' 
  | 'EDI Gateway' 
  | 'File Upload' 
  | 'FHIR API' 
  | 'SFTP Feed'
```

## Usage Examples

### Basic Usage

```tsx
import { DataSourceList } from '@/components/data-source-list'
import { useDataSourcesStore } from '@/stores/data-sources-store'

export function DataSourcesPage() {
  const dataSources = useDataSourcesStore((state) => state.dataSources)

  const handleEdit = (id: string) => {
    console.log('Edit data source:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete data source:', id)
  }

  return (
    <DataSourceList
      dataSources={dataSources}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
```

### With Zustand Store Integration

```tsx
import { DataSourceList } from '@/components/data-source-list'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import { useState } from 'react'

export function DataSourcesPage() {
  const dataSources = useDataSourcesStore((state) => state.dataSources)
  const deleteDataSource = useDataSourcesStore((state) => state.deleteDataSource)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    setEditingId(id)
    // Open edit dialog/form
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this data source?')) {
      deleteDataSource(id)
    }
  }

  return (
    <DataSourceList
      dataSources={dataSources}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
```

### With Dialog for Edit/Delete Confirmation

```tsx
import { DataSourceList } from '@/components/data-source-list'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DataSourcesPage() {
  const dataSources = useDataSourcesStore((state) => state.dataSources)
  const deleteDataSource = useDataSourcesStore((state) => state.deleteDataSource)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    // Open edit form
    console.log('Edit:', id)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedId) {
      deleteDataSource(selectedId)
      setDeleteDialogOpen(false)
      setSelectedId(null)
    }
  }

  return (
    <>
      <DataSourceList
        dataSources={dataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Data Source</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this data source? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Filtering Data Sources

```tsx
import { DataSourceList } from '@/components/data-source-list'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function DataSourcesPage() {
  const dataSources = useDataSourcesStore((state) => state.dataSources)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all')

  const filteredDataSources = dataSources.filter((ds) => {
    if (statusFilter === 'all') return true
    return ds.status === statusFilter
  })

  const handleEdit = (id: string) => {
    console.log('Edit:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete:', id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label htmlFor="status-filter">Filter by status:</label>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataSourceList
        dataSources={filteredDataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
```

### Custom Styling

```tsx
import { DataSourceList } from '@/components/data-source-list'
import { useDataSourcesStore } from '@/stores/data-sources-store'

export function DataSourcesPage() {
  const dataSources = useDataSourcesStore((state) => state.dataSources)

  return (
    <DataSourceList
      dataSources={dataSources}
      onEdit={(id) => console.log('Edit:', id)}
      onDelete={(id) => console.log('Delete:', id)}
      className="shadow-lg"
    />
  )
}
```

## Status Indicators

The component displays status indicators with color coding:

### Active Status
- **Color**: Green (`text-green-600 dark:text-green-400`)
- **Icon**: CheckCircle2
- **Background**: Light green (`bg-green-100 dark:bg-green-900/30`)
- **Meaning**: Data source is active and functioning

### Inactive Status
- **Color**: Gray (`text-gray-600 dark:text-gray-400`)
- **Icon**: AlertCircle
- **Background**: Light gray (`bg-gray-100 dark:bg-gray-900/30`)
- **Meaning**: Data source is configured but not currently active

### Error Status
- **Color**: Red (`text-red-600 dark:text-red-400`)
- **Icon**: XCircle
- **Background**: Light red (`bg-red-100 dark:bg-red-900/30`)
- **Meaning**: Data source has encountered an error

## Empty State

When no data sources are configured, the component displays a helpful empty state:

```
No data sources configured
Add a data source to start integrating claims data
```

## Accessibility

The DataSourceList component follows accessibility best practices:

- **Table Structure**: Proper semantic HTML table with thead and tbody
- **ARIA Labels**: All action buttons include descriptive `aria-label` attributes
- **Status Labels**: Status indicators include `aria-label` for screen readers
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Proper focus indicators on buttons
- **Screen Reader Support**: All content is properly announced by screen readers

## Theme Support

The component fully supports both light and dark themes:

- **Light Theme**: Uses standard colors with good contrast
- **Dark Theme**: Automatically adjusts colors using Tailwind's `dark:` variants
- **Status Colors**: All status indicators have dark mode variants
- **Table Styling**: Border and background colors adapt to theme
- **Hover Effects**: Subtle hover effects work in both themes

## Responsive Design

- **Desktop**: Full table layout with all columns visible
- **Tablet**: Table remains functional with horizontal scrolling if needed
- **Mobile**: Horizontal scrolling enabled for narrow viewports
- **Touch Support**: Action buttons are sized appropriately for touch targets

## Performance

- **Lightweight**: Minimal dependencies (shadcn/ui components)
- **Optimized Rendering**: Only re-renders when props change
- **No Virtual Scrolling**: Suitable for moderate lists (< 100 items)
- **Efficient Updates**: Uses React keys for optimal list updates

## Testing

The component includes comprehensive unit tests covering:

- ✅ Basic rendering with data sources
- ✅ Status indicators (active, inactive, error)
- ✅ Last sync time display
- ✅ Action button functionality
- ✅ Empty state
- ✅ Accessibility features
- ✅ Theme support
- ✅ Edge cases (long names, all data source types, etc.)

Run tests with:

```bash
npm test -- data-source-list.test.tsx
```

## Related Components

- **Table**: Base table component from shadcn/ui
- **Button**: Button component for actions
- **Dialog**: Dialog component for confirmations
- **DataSourceForm**: Form component for adding/editing data sources

## Related Utilities

- **formatRelativeDate**: Format dates as relative time (e.g., "2 days ago")
- **cn**: Utility for merging Tailwind classes

## Related Stores

- **useDataSourcesStore**: Zustand store for managing data sources

## Requirements Satisfied

This component satisfies the following requirements from the design document:

- **Requirement 2.1**: Display a list of all configured data sources
- **Requirement 2.8**: Allow editing existing data source configurations
- **Requirement 2.9**: Allow removing data source configurations

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
7. Test with various data source types and statuses

## License

Part of the Claims Management UI application.
