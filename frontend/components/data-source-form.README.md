# DataSourceForm Component

A comprehensive form component for adding and editing data source configurations with dynamic fields based on the selected data source type.

## Features

- **Dynamic Form Fields**: Automatically displays relevant configuration fields based on selected data source type
- **Five Data Source Types Supported**:
  - Claims API (endpoint, API key, optional timeout)
  - EDI Gateway (host, port, username, password)
  - File Upload (allowed extensions, max file size)
  - FHIR API (base URL, version, auth token)
  - SFTP Feed (host, port, username, private key, remote path)
- **Form Validation**: Uses Zod schemas for comprehensive validation
- **Edit Mode**: Pre-fills form with existing data source values
- **Status Management**: Select active, inactive, or error status
- **Accessible**: ARIA labels, required field indicators, error announcements
- **Theme Support**: Works seamlessly with light and dark themes

## Usage

### Basic Usage (Create Mode)

```tsx
import { DataSourceForm } from '@/components/data-source-form'

function CreateDataSource() {
  const handleSubmit = (data) => {
    console.log('New data source:', data)
    // Save to backend
  }

  const handleCancel = () => {
    console.log('Form cancelled')
    // Close dialog or navigate away
  }

  return (
    <DataSourceForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  )
}
```

### Edit Mode

```tsx
import { DataSourceForm } from '@/components/data-source-form'

function EditDataSource({ existingDataSource }) {
  const handleSubmit = (data) => {
    console.log('Updated data source:', data)
    // Update backend
  }

  const handleCancel = () => {
    console.log('Edit cancelled')
  }

  return (
    <DataSourceForm
      dataSource={existingDataSource}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSubmit` | `(data: Omit<DataSource, 'id' \| 'createdAt' \| 'updatedAt'>) => void` | Yes | Callback when form is submitted with valid data |
| `onCancel` | `() => void` | Yes | Callback when form is cancelled |
| `dataSource` | `DataSource` | No | Existing data source for editing (enables edit mode) |
| `className` | `string` | No | Optional CSS classes for styling |

## Data Source Types

### Claims API

Configuration fields:
- **Endpoint** (required): API endpoint URL
- **API Key** (required): Authentication key
- **Timeout** (optional): Request timeout in milliseconds

### EDI Gateway

Configuration fields:
- **Host** (required): Gateway hostname
- **Port** (required): Port number (1-65535)
- **Username** (required): Authentication username
- **Password** (required): Authentication password

### File Upload

Configuration fields:
- **Allowed Extensions** (required): Comma-separated list of file extensions (e.g., `.xls, .xlsx`)
- **Max File Size** (required): Maximum file size in bytes

### FHIR API

Configuration fields:
- **Base URL** (required): FHIR server base URL
- **Version** (required): FHIR version (e.g., `R4`)
- **Auth Token** (required): Authentication token

### SFTP Feed

Configuration fields:
- **Host** (required): SFTP server hostname
- **Port** (required): Port number (1-65535)
- **Username** (required): SFTP username
- **Private Key** (required): SSH private key
- **Remote Path** (required): Path to files on remote server

## Validation

The component uses Zod schemas for validation:

- **Name**: Required, non-empty string
- **Type**: Must be one of the five supported types
- **Status**: Must be 'active', 'inactive', or 'error'
- **Configuration**: Type-specific validation rules
  - URLs must be valid
  - Ports must be integers between 1-65535
  - File extensions must be provided
  - All required fields must be filled

Validation errors are displayed in a clear, accessible format below the form.

## Behavior

### Create Mode
- Form starts with empty fields
- Data source type defaults to "Claims API"
- Status defaults to "active"
- Submit button shows "Create"
- Type selector is enabled

### Edit Mode
- Form pre-fills with existing data source values
- Data source type is disabled (cannot be changed)
- Submit button shows "Update"
- Helper text explains type cannot be changed

### Error Handling
- Validation errors are displayed in an alert box
- Each error shows the field path and message
- Errors are announced to screen readers via `aria-live="polite"`
- Errors clear when data source type changes

## Accessibility

- All form fields have proper labels
- Required fields are marked with asterisks and `aria-required="true"`
- Error messages are announced to screen readers
- Form has proper semantic structure
- Keyboard navigation is fully supported
- Help text provided for complex fields

## Styling

The component uses Tailwind CSS and shadcn/ui components for consistent styling:
- Responsive layout
- Dark mode support
- Consistent spacing and typography
- Focus indicators for keyboard navigation

## Example: In a Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataSourceForm } from '@/components/data-source-form'

function DataSourceDialog({ open, onOpenChange, dataSource }) {
  const handleSubmit = (data) => {
    // Save data
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {dataSource ? 'Edit Data Source' : 'Add Data Source'}
          </DialogTitle>
        </DialogHeader>
        <DataSourceForm
          dataSource={dataSource}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
```

## Requirements Validated

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

- ✅ 2.2: Support adding Claims API data source
- ✅ 2.3: Support adding EDI Gateway data source
- ✅ 2.4: Support adding File Upload data source
- ✅ 2.5: Support adding FHIR API data source
- ✅ 2.6: Support adding SFTP Feed data source
- ✅ 2.7: Validate connection parameters before saving
- ✅ 2.8: Allow editing existing data source configurations
