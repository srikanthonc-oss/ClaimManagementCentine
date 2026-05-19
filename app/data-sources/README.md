# Data Sources Page

The Data Sources page provides a comprehensive interface for managing data source configurations in the Claims Management UI.

## Overview

This page allows system administrators to:
- View all configured data sources
- Add new data sources
- Edit existing data source configurations
- Delete data sources with confirmation
- Handle errors gracefully during CRUD operations

## Features

### Data Source List
- Displays all configured data sources in a table format
- Shows data source name, type, status, and last sync time
- Provides edit and delete actions for each data source
- Empty state when no data sources exist

### Add Data Source
- Opens a dialog with the DataSourceForm component
- Supports all data source types:
  - Claims API
  - EDI Gateway
  - File Upload
  - FHIR API
  - SFTP Feed
- Validates configuration before saving
- Displays validation errors inline

### Edit Data Source
- Opens a dialog pre-filled with existing data source configuration
- Prevents changing data source type after creation
- Validates updates before saving
- Displays validation errors inline

### Delete Data Source
- Opens a confirmation dialog before deletion
- Shows data source name in confirmation message
- Prevents accidental deletions
- Irreversible action with clear warning

### Error Handling
- Displays errors from CRUD operations
- Shows validation errors from the store
- Allows dismissing errors
- Maintains form state when errors occur

## Components Used

- **DataSourceList**: Displays the list of data sources
- **DataSourceForm**: Form for adding/editing data sources
- **ErrorDisplay**: Shows error messages
- **Dialog**: Modal for add/edit forms
- **AlertDialog**: Confirmation dialog for deletions

## State Management

The page uses the Zustand data sources store (`useDataSourcesStore`) for:
- Fetching all data sources
- Adding new data sources
- Updating existing data sources
- Deleting data sources
- Retrieving data sources by ID

## Requirements Validated

This component validates the following requirements:
- **2.1**: Display list of all configured data sources
- **2.2**: Support adding Claims API data source
- **2.3**: Support adding EDI Gateway data source
- **2.4**: Support adding File Upload data source
- **2.5**: Support adding FHIR API data source
- **2.6**: Support adding SFTP Feed data source
- **2.7**: Validate connection parameters before saving
- **2.8**: Allow editing existing data source configurations
- **2.9**: Allow removing data source configurations
- **2.10**: Prompt for confirmation before deletion
- **11.1**: Display error messages with failure reasons

## Usage

Navigate to `/data-sources` to access the page.

### Adding a Data Source

1. Click the "Add Data Source" button
2. Fill in the data source name
3. Select the data source type
4. Configure type-specific settings
5. Click "Create" to save

### Editing a Data Source

1. Click the "Edit" button on a data source row
2. Modify the configuration fields
3. Click "Update" to save changes

### Deleting a Data Source

1. Click the "Delete" button on a data source row
2. Confirm the deletion in the dialog
3. The data source will be permanently removed

## Testing

The page has comprehensive unit tests covering:
- Page rendering
- Add functionality
- Edit functionality
- Delete functionality
- Error handling
- Dialog interactions

Run tests with:
```bash
npm test -- app/data-sources/page.test.tsx
```

## Accessibility

- All buttons have proper aria-labels
- Dialogs have proper roles and descriptions
- Form fields have associated labels
- Error messages are announced to screen readers
- Keyboard navigation is fully supported

## Theme Support

The page supports both light and dark themes through the theme provider.
