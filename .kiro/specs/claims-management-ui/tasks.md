# Implementation Plan: Claims Management UI

## Overview

This implementation plan breaks down the Claims Management UI into discrete, actionable tasks for building a modern Next.js 14+ application with TypeScript, Tailwind CSS, and Zustand state management. The application provides healthcare claims processing teams with a comprehensive interface for managing claims data from multiple sources, including file uploads, dynamic visualization, and flexible filtering.

The implementation follows a bottom-up approach: establishing the foundation (project setup, types, utilities), building core reusable components (layout, theme, tables), implementing feature-specific pages (dashboard, data sources, file intake, pend processing), and finally integrating everything with comprehensive testing.

## Tasks

- [x] 1. Project Setup and Configuration
  - Initialize Next.js 14+ project with TypeScript and App Router
  - Configure Tailwind CSS 3+ with custom theme configuration
  - Install and configure core dependencies: Zustand, TanStack Query, Zod, SheetJS (xlsx), date-fns, Lucide React
  - Install and configure shadcn/ui components (Button, Card, Table, Tabs, Dialog, Select, Checkbox, Input, Label)
  - Set up ESLint and Prettier with TypeScript rules
  - Configure path aliases (@/ for src directory)
  - Create project directory structure: `app/`, `components/`, `lib/`, `hooks/`, `types/`, `stores/`, `utils/`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 2. Core Type Definitions and Data Models
  - [x] 2.1 Create TypeScript type definitions
    - Define `Platform`, `Classification`, `ClaimStatus`, `DataSourceType` types
    - Define `Claim` interface with all required fields (id, claimNumber, classification, platform, providerName, billedAmount, status, confidence, daysAged, state, timestamps)
    - Define `DataSource` interface and all `DataSourceConfig` variants (ClaimsAPIConfig, EDIGatewayConfig, FileUploadConfig, FHIRAPIConfig, SFTPFeedConfig)
    - Define `DashboardMetrics` interface
    - Define `FileUploadResult` and `FileParseError` interfaces
    - Create types file at `types/index.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

  - [x] 2.2 Create Zod validation schemas
    - Create Zod schema for `Claim` with validation rules (billedAmount as positive number, daysAged as non-negative integer, confidence 0-100)
    - Create Zod schemas for all `DataSourceConfig` variants
    - Create Zod schema for file upload validation
    - Create utility functions for schema validation with error formatting
    - Create schemas file at `lib/schemas.ts`
    - _Requirements: 11.4, 11.5, 11.6_

- [x] 3. Theme Management System
  - [x] 3.1 Implement ThemeProvider component
    - Create ThemeProvider component with context for theme state ('light' | 'dark')
    - Implement theme switching logic with localStorage persistence
    - Apply theme class to document root element
    - Ensure theme loads from localStorage on mount
    - Create component at `components/theme-provider.tsx`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.2 Create theme toggle component
    - Create ThemeToggle component with sun/moon icons (Lucide React)
    - Implement smooth transition between themes (500ms)
    - Add accessible labels and keyboard support
    - Create component at `components/theme-toggle.tsx`
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 3.3 Configure Tailwind dark mode
    - Update `tailwind.config.ts` with dark mode class strategy
    - Define custom color palette for light and dark themes
    - Ensure all text and interactive elements have proper contrast in both themes
    - Test color accessibility with WCAG AA standards
    - _Requirements: 8.6, 8.7_

- [x] 4. Layout and Navigation
  - [x] 4.1 Create root layout component
    - Implement `app/layout.tsx` with HTML structure
    - Integrate ThemeProvider wrapper
    - Add TanStack Query provider
    - Configure metadata (title, description)
    - Apply global styles and font configuration
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 4.2 Create navigation component
    - Create Navigation component with links to Dashboard, Data Sources, File Intake, Pend Processing
    - Implement active state indication using Next.js `usePathname` hook
    - Add responsive mobile menu with hamburger icon
    - Style with Tailwind CSS for both light and dark themes
    - Add ThemeToggle component to navigation
    - Create component at `components/navigation.tsx`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 4.3 Create AppLayout wrapper component
    - Create AppLayout component that combines Navigation and page content
    - Implement responsive layout with sidebar navigation on desktop, top navigation on mobile
    - Add proper spacing and container constraints
    - Create component at `components/app-layout.tsx`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 5. Zustand State Management
  - [x] 5.1 Create claims store
    - Create Zustand store for claims data with actions: `setClaims`, `addClaims`, `clearClaims`, `updateClaim`
    - Add selectors for filtering claims by platform, classification, status
    - Add computed values for metrics (total count, counts by classification/platform/status)
    - Create store at `stores/claims-store.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3_

  - [x] 5.2 Create data sources store
    - Create Zustand store for data sources with actions: `addDataSource`, `updateDataSource`, `deleteDataSource`, `setDataSources`
    - Add validation logic for data source configurations
    - Create store at `stores/data-sources-store.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 5.3 Create UI state store
    - Create Zustand store for UI state: active tab, expanded groups, selected platforms, search queries
    - Add actions for updating UI state
    - Create store at `stores/ui-store.ts`
    - _Requirements: 4.5, 6.4, 6.5, 7.4_

- [x] 6. Utility Functions and Hooks
  - [x] 6.1 Create data formatting utilities
    - Create `formatCurrency` function for BilledAmount display
    - Create `formatDate` function using date-fns
    - Create `formatConfidence` function for percentage display
    - Create utilities file at `lib/utils.ts`
    - _Requirements: 5.6_

  - [x] 6.2 Create XLS parser utility
    - Create `parseXLSFile` function using SheetJS (xlsx) library
    - Implement column mapping for all claim fields (ClaimNumber, Classification, Platform, ProviderName, BilledAmount, Status, Confidence, DaysAged, State)
    - Add validation for required columns
    - Add error handling for invalid file format, missing columns, invalid data types
    - Return `FileUploadResult` with parsed claims and errors
    - Create parser at `lib/xls-parser.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_

  - [x] 6.3 Create custom hooks
    - Create `useDebounce` hook for search input (300ms delay)
    - Create `useLocalStorage` hook for persisting user preferences
    - Create `useMediaQuery` hook for responsive design
    - Create hooks file at `hooks/index.ts`
    - _Requirements: 12.6_

- [x] 7. Reusable UI Components
  - [x] 7.1 Create MetricsCard component
    - Create MetricsCard component with props: title, value, icon, trend
    - Style with shadcn/ui Card component
    - Add loading skeleton state
    - Support both light and dark themes
    - Create component at `components/metrics-card.tsx`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 7.2 Create ClaimsTable component with virtual scrolling
    - Create ClaimsTable component with columns for all claim attributes
    - Implement virtual scrolling using @tanstack/react-virtual for performance with 1000+ rows
    - Add sortable column headers with sort indicators
    - Add search input with debounced filtering (300ms)
    - Format BilledAmount as currency
    - Add loading and empty states
    - Create component at `components/claims-table.tsx`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 12.1, 12.5_

  - [x] 7.3 Create ErrorDisplay component
    - Create ErrorDisplay component for showing error messages
    - Support different error types (connection, parsing, network, validation)
    - Add retry action button where applicable
    - Style with appropriate colors and icons
    - Create component at `components/error-display.tsx`
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

  - [x] 7.4 Create LoadingSpinner component
    - Create LoadingSpinner component with customizable size
    - Add smooth animation
    - Support both light and dark themes
    - Create component at `components/loading-spinner.tsx`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 8. Dashboard Page Implementation
  - [x] 8.1 Create dashboard metrics calculation logic
    - Create `calculateDashboardMetrics` function that aggregates claims data
    - Calculate total claims count
    - Calculate counts by classification, platform, status
    - Calculate total and average billed amounts
    - Calculate average days aged for pending claims
    - Create utility at `lib/metrics.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 8.2 Create dashboard page component
    - Create `app/dashboard/page.tsx` with DashboardPage component
    - Fetch claims data using TanStack Query
    - Calculate metrics using `calculateDashboardMetrics`
    - Display metrics in grid layout using MetricsCard components
    - Add auto-refresh every 30 seconds
    - Ensure metrics update within 2 seconds of data change
    - Add error handling with ErrorDisplay component
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 11.1, 11.3_

  - [x] 8.3 Add dashboard charts (optional visualization)
    - Install recharts library for data visualization
    - Create ClassificationChart component (bar chart)
    - Create PlatformChart component (bar chart)
    - Integrate charts into dashboard page
    - Ensure charts are responsive and theme-aware
    - Create components at `components/charts/`
    - _Requirements: 1.2, 1.3_

- [x] 9. Data Sources Management Page
  - [x] 9.1 Create DataSourceList component
    - Create DataSourceList component displaying all data sources in a table or card grid
    - Show data source name, type, status, last sync time
    - Add Edit and Delete action buttons for each data source
    - Add status indicators (active, inactive, error) with appropriate colors
    - Create component at `components/data-sources/data-source-list.tsx`
    - _Requirements: 2.1, 2.8, 2.9_

  - [x] 9.2 Create DataSourceForm component
    - Create DataSourceForm component with dynamic fields based on data source type
    - Implement DataSourceTypeSelector for choosing type (Claims API, EDI Gateway, File Upload, FHIR API, SFTP Feed)
    - Create conditional form fields for each data source type configuration
    - Add form validation using Zod schemas
    - Implement connection validation before saving
    - Add Save and Cancel buttons
    - Create component at `components/data-sources/data-source-form.tsx`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 9.3 Create data sources page component
    - Create `app/data-sources/page.tsx` with DataSourcesPage component
    - Integrate DataSourceList component
    - Add "Add Data Source" button that opens DataSourceForm in a dialog
    - Implement edit functionality that opens DataSourceForm with existing data
    - Implement delete functionality with confirmation dialog
    - Connect to data sources Zustand store
    - Add error handling for CRUD operations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 11.1_

- [x] 10. File Intake Page Implementation
  - [x] 10.1 Create FileUploader component
    - Create FileUploader component with drag-and-drop zone
    - Accept only .xls and .xlsx files
    - Enforce 50MB maximum file size
    - Show upload progress indicator
    - Display file validation errors (invalid format, file too large, missing columns)
    - Trigger parsing on successful upload
    - Create component at `components/file-intake/file-uploader.tsx`
    - _Requirements: 3.1, 3.2, 3.12, 3.13_

  - [x] 10.2 Create DynamicTabs component
    - Create DynamicTabs component that generates tabs from unique classification values
    - Sort tabs alphabetically by classification name
    - Display claim count in each tab label
    - Highlight active tab
    - Ensure tab switching happens within 300ms
    - Create component at `components/file-intake/dynamic-tabs.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 12.3_

  - [x] 10.3 Create file intake page component
    - Create `app/file-intake/page.tsx` with FileIntakePage component
    - Integrate FileUploader component
    - Call `parseXLSFile` utility when file is uploaded
    - Store parsed claims in Zustand claims store
    - Generate tabs using DynamicTabs component based on unique classifications
    - Display claims in active tab using ClaimsTable component
    - Filter claims by selected classification
    - Show total parsed claims count on successful upload
    - Display parsing errors using ErrorDisplay component
    - Add loading state during parsing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 11.2_

- [x] 11. Pend Processing Page Implementation
  - [x] 11.1 Create PlatformFilter component
    - Create PlatformFilter component with checkboxes for Facet, Amisys, Xcelys
    - Display claim count for each platform
    - Support multi-select functionality
    - Update selected platforms in UI state store
    - Create component at `components/pend-processing/platform-filter.tsx`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 11.2 Create ClassificationGroup component
    - Create ClassificationGroup component as collapsible accordion
    - Display classification name and claim count in header
    - Show ClaimsTable with filtered claims when expanded
    - Support expand/collapse toggle
    - Apply platform filters to claims within group
    - Create component at `components/pend-processing/classification-group.tsx`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 11.3 Create pend processing page component
    - Create `app/pend-processing/page.tsx` with PendProcessingPage component
    - Fetch claims data with status "Pending" or "In Review"
    - Integrate PlatformFilter component in sidebar
    - Group claims by classification
    - Render ClassificationGroup component for each classification
    - Apply platform filters to all groups
    - Ensure filtering updates display within 500ms
    - Add loading and error states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 12.2_

- [ ] 12. API Routes and Data Fetching
  - [x] 12.1 Create mock data generator
    - Create utility to generate mock claims data for development
    - Generate realistic data with varied classifications, platforms, statuses
    - Create utility at `lib/mock-data.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 12.2 Create API route for claims data
    - Create `app/api/claims/route.ts` for fetching claims
    - Support query parameters for filtering (platform, classification, status)
    - Return paginated results
    - Add error handling with appropriate HTTP status codes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.3_

  - [ ] 12.3 Create API route for file upload
    - Create `app/api/upload/route.ts` for handling XLS file uploads
    - Accept multipart/form-data with file
    - Call `parseXLSFile` utility
    - Return `FileUploadResult` with parsed claims or errors
    - Add error handling for file size, format, parsing errors
    - _Requirements: 3.1, 3.2, 3.12, 3.13, 11.2_

  - [x] 12.4 Create API route for data sources
    - Create `app/api/data-sources/route.ts` for CRUD operations
    - Implement GET (list), POST (create), PUT (update), DELETE (remove)
    - Add validation using Zod schemas
    - Add connection validation logic
    - Return appropriate error messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 11.1_

  - [x] 12.5 Create TanStack Query hooks
    - Create `useClaims` hook for fetching claims data with caching
    - Create `useDataSources` hook for fetching data sources
    - Create `useUploadFile` mutation hook for file uploads
    - Create `useDataSourceMutations` hooks for create/update/delete operations
    - Configure stale time, cache time, and refetch strategies
    - Create hooks at `hooks/queries.ts`
    - _Requirements: 1.7, 11.3_

- [ ] 13. Error Handling and Logging
  - [ ] 13.1 Implement global error boundary
    - Create ErrorBoundary component to catch React errors
    - Display user-friendly error message
    - Log errors to console
    - Create component at `components/error-boundary.tsx`
    - _Requirements: 11.7_

  - [ ] 13.2 Add error logging utility
    - Create error logging utility that logs to console with context
    - Add error categorization (connection, parsing, network, validation)
    - Create utility at `lib/error-logger.ts`
    - _Requirements: 11.7_

  - [ ] 13.3 Implement error handling in all API routes
    - Add try-catch blocks to all API routes
    - Return consistent error response format
    - Log errors with context
    - Return appropriate HTTP status codes (400, 404, 500)
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

- [ ] 14. Performance Optimization
  - [ ] 14.1 Implement code splitting
    - Configure dynamic imports for page components
    - Add loading states for lazy-loaded components
    - Verify bundle size reduction
    - _Requirements: 10.5_

  - [ ] 14.2 Optimize ClaimsTable rendering
    - Verify virtual scrolling implementation handles 1000+ rows
    - Add memoization to ClaimsTableRow component
    - Optimize sort and filter operations
    - Test rendering performance with large datasets
    - _Requirements: 12.1, 12.5_

  - [ ] 14.3 Add debouncing to search inputs
    - Verify useDebounce hook is applied to all search inputs (300ms)
    - Test search performance with large datasets
    - _Requirements: 12.6_

  - [ ] 14.4 Optimize theme switching
    - Ensure theme transitions complete within 500ms
    - Add CSS transitions for smooth color changes
    - Test theme switching performance
    - _Requirements: 8.3, 12.4_

- [ ] 15. Checkpoint - Core Functionality Complete
  - Verify all pages are accessible via navigation
  - Test theme switching across all pages
  - Test file upload and parsing with sample XLS file
  - Test data source CRUD operations
  - Test platform filtering and classification grouping
  - Verify virtual scrolling performance with 1000+ claims
  - Check error handling for all failure scenarios
  - Ensure all tests pass, ask the user if questions arise

- [ ] 16. Testing Implementation
  - [ ]* 16.1 Write unit tests for utilities
    - Test `formatCurrency`, `formatDate`, `formatConfidence` functions
    - Test `parseXLSFile` with valid and invalid files
    - Test `calculateDashboardMetrics` with various data sets
    - Test Zod schema validations
    - Use Vitest for unit testing
    - Create tests at `__tests__/lib/`
    - _Requirements: 3.12, 3.13, 11.4, 11.5, 11.6_

  - [ ]* 16.2 Write unit tests for components
    - Test MetricsCard rendering with different props
    - Test ClaimsTable sorting and filtering
    - Test DynamicTabs generation and switching
    - Test PlatformFilter multi-select behavior
    - Test ClassificationGroup expand/collapse
    - Test ThemeProvider theme switching and persistence
    - Create tests at `__tests__/components/`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.4, 6.5, 6.6, 7.4, 8.3, 8.4, 8.5_

  - [ ]* 16.3 Write integration tests for pages
    - Test dashboard page metrics calculation and display
    - Test data sources page CRUD operations
    - Test file intake page upload and parsing flow
    - Test pend processing page filtering and grouping
    - Use Vitest with React Testing Library
    - Create tests at `__tests__/app/`
    - _Requirements: 1.7, 2.10, 3.14, 6.7, 7.6_

  - [ ]* 16.4 Write E2E tests with Playwright
    - Test complete user flow: navigate to file intake, upload file, view claims in tabs
    - Test data source creation and editing flow
    - Test platform filtering in pend processing
    - Test theme switching persistence across page navigation
    - Test error scenarios (invalid file, connection failure)
    - Create tests at `e2e/`
    - _Requirements: 9.6, 12.1, 12.2, 12.3, 12.4_

- [ ] 17. Accessibility and Polish
  - [ ] 17.1 Add ARIA labels and roles
    - Add ARIA labels to all interactive elements
    - Add proper heading hierarchy
    - Ensure keyboard navigation works for all components
    - Test with screen reader
    - _Requirements: 8.6, 8.7_

  - [ ] 17.2 Add loading states and skeletons
    - Add skeleton loaders for dashboard metrics
    - Add loading spinners for data fetching
    - Add progress indicators for file uploads
    - Ensure smooth transitions between loading and loaded states
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 17.3 Add empty states
    - Add empty state for dashboard with no claims
    - Add empty state for data sources list
    - Add empty state for file intake before upload
    - Add empty state for pend processing with no pending claims
    - Add helpful messages and call-to-action buttons
    - _Requirements: 1.1, 2.1, 4.7_

  - [ ] 17.4 Responsive design refinement
    - Test all pages on mobile, tablet, and desktop viewports
    - Ensure tables are horizontally scrollable on mobile
    - Ensure navigation collapses to hamburger menu on mobile
    - Test touch interactions on mobile devices
    - _Requirements: 9.6_

- [ ] 18. Documentation and Deployment Preparation
  - [ ] 18.1 Create README documentation
    - Document project setup and installation steps
    - Document available scripts (dev, build, test, lint)
    - Document environment variables and configuration
    - Document project structure and key components
    - Add usage examples and screenshots
    - Create README.md at project root

  - [ ] 18.2 Add inline code documentation
    - Add JSDoc comments to all utility functions
    - Add prop type documentation to all components
    - Document complex logic and algorithms
    - Add usage examples in comments

  - [ ] 18.3 Configure production build
    - Verify production build completes without errors
    - Test production build locally
    - Verify code splitting and bundle optimization
    - Check for console errors and warnings
    - _Requirements: 10.5_

  - [ ] 18.4 Create sample data files
    - Create sample XLS file with valid claims data for testing
    - Create sample XLS file with invalid data for error testing
    - Document file format requirements
    - Add sample files to `public/samples/` directory
    - _Requirements: 3.1, 3.2, 3.12, 3.13_

- [ ] 19. Final Checkpoint - Production Ready
  - Run full test suite and ensure all tests pass
  - Verify all requirements are implemented and functional
  - Test complete user workflows end-to-end
  - Verify performance benchmarks are met (render times, filtering speed, theme switching)
  - Check accessibility compliance
  - Review error handling for all edge cases
  - Verify theme consistency across all pages
  - Test with realistic data volumes (1000+ claims)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The implementation follows a bottom-up approach: foundation → reusable components → feature pages → integration
- Virtual scrolling is critical for performance with large datasets (1000+ claims)
- Theme support must be consistent across all components and pages
- Error handling should provide clear, actionable messages to users
- All data validation should use Zod schemas for type safety and consistency
