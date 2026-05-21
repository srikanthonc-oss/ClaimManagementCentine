# File Intake Page

The File Intake page provides a comprehensive interface for uploading and viewing claims data from XLS/XLSX files.

## Features

- **File Upload**: Drag-and-drop or click-to-browse file upload with validation
- **XLS Parsing**: Automatic parsing of XLS/XLSX files with comprehensive error handling
- **Dynamic Tabs**: Auto-generated tabs based on unique claim classifications
- **Claims Display**: High-performance table with sorting, searching, and virtual scrolling
- **Error Handling**: Clear error messages for parsing failures and validation issues
- **Loading States**: Visual feedback during file processing
- **Success Feedback**: Confirmation message with parsed claims count
- **State Management**: Integration with Zustand store for centralized claims data

## Usage

### Accessing the Page

Navigate to `/file-intake` in the application.

### Uploading a File

1. Click the upload area or drag and drop an XLS/XLSX file
2. The file will be automatically parsed
3. Success message displays the number of parsed claims
4. Claims are organized into tabs by classification

### Viewing Claims

- **Tabs**: Click on classification tabs to filter claims
- **Search**: Use the search box to find claims by number or provider name
- **Sort**: Click column headers to sort claims
- **Scroll**: Virtual scrolling handles large datasets efficiently

## File Format Requirements

The XLS file must contain the following columns:

- **ClaimNumber**: Unique claim identifier (required)
- **Classification**: One of: DUAL, Duplicate, COB, Pricing, Auth, Corrected Claims, High Dollar, Other Pend (required)
- **Platform**: One of: Facet, Amisys, Xcelys (required)
- **ProviderName**: Name of the healthcare provider (required)
- **BilledAmount**: Numeric value (required, must be positive)
- **Status**: One of: Pending, Approved, Denied, In Review (required)
- **Confidence**: Numeric value between 0-100 (required)
- **DaysAged**: Non-negative integer (required)
- **State**: 2-character US state code (required)

### Example File Structure

| ClaimNumber | Classification | Platform | ProviderName | BilledAmount | Status | Confidence | DaysAged | State |
|-------------|----------------|----------|--------------|--------------|--------|------------|----------|-------|
| CLM001      | DUAL           | Facet    | Provider A   | 1500.00      | Pending| 95         | 10       | CA    |
| CLM002      | COB            | Amisys   | Provider B   | 2000.00      | Approved| 90        | 5        | NY    |

## Error Handling

### File Validation Errors

- **Invalid Format**: File must be .xls or .xlsx
- **File Too Large**: Maximum file size is 50MB
- **Missing Columns**: All required columns must be present

### Parsing Errors

- **Invalid Values**: Data must match expected types and formats
- **Missing Data**: Required fields cannot be empty
- **Validation Failures**: Values must meet validation rules (e.g., confidence 0-100)

Errors are displayed with:
- Row number where the error occurred
- Column name (if applicable)
- Descriptive error message
- Severity indicator (error/warning)

## Components Used

- **FileUploader**: Handles file upload and initial validation
- **DynamicTabs**: Generates tabs from unique classifications
- **ClaimsTable**: Displays claims with sorting and searching
- **ErrorDisplay**: Shows parsing and validation errors
- **LoadingSpinner**: Indicates processing state

## State Management

The page integrates with the Zustand claims store:

- **setClaims**: Replaces all claims with newly parsed data
- **claims**: Current claims in the store
- **getCountByClassification**: Gets claim counts for tab labels

## Performance

- **Virtual Scrolling**: Efficiently handles 1000+ claims
- **Debounced Search**: 300ms delay for search input
- **Optimized Rendering**: Memoized computations for filtering and sorting
- **Tab Switching**: <300ms response time

## Accessibility

- Proper heading hierarchy (h1, h2)
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatible
- Status announcements for success/error states

## Requirements Validated

This page validates the following requirements:

- **3.1-3.14**: XLS file upload and parsing
- **4.1-4.7**: Dynamic tab creation by classification
- **5.1-5.12**: Claims data display in file intake
- **11.2**: Error handling for parsing failures

## Testing

Comprehensive unit tests cover:

- Initial render and empty states
- File upload workflow
- Claims storage in Zustand store
- Dynamic tab generation
- Claims filtering by classification
- Tab switching behavior
- Error handling
- Success feedback
- Integration with store
- Accessibility features

Run tests with:

```bash
npm test -- app/file-intake/page.test.tsx
```

## Related Components

- [FileUploader](../../components/file-intake/file-uploader.README.md)
- [DynamicTabs](../../components/file-intake/dynamic-tabs.README.md)
- [ClaimsTable](../../components/claims-table.README.md)
- [ErrorDisplay](../../components/error-display.README.md)

## Future Enhancements

- Export filtered claims to CSV/Excel
- Bulk claim actions (approve, deny, etc.)
- Advanced filtering options
- Claim detail modal/drawer
- File upload history
- Batch file processing
