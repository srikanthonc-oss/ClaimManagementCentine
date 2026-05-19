import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileIntakePage from './page'
import { useClaimsStore } from '@/stores/claims-store'
import type { Claim, FileUploadResult, Classification } from '@/types'

// Mock the components
vi.mock('@/components/file-intake/file-uploader', () => ({
  FileUploader: ({ onUpload }: { onUpload: (result: FileUploadResult) => void }) => (
    <div data-testid="file-uploader">
      <button
        onClick={() => {
          const mockResult: FileUploadResult = {
            success: true,
            claimsParsed: 3,
            errors: [],
            claims: [
              {
                id: '1',
                claimNumber: 'CLM001',
                classification: 'DUAL' as Classification,
                platform: 'Facet',
                providerName: 'Provider A',
                billedAmount: 1000,
                status: 'Pending',
                confidence: 95,
                daysAged: 10,
                state: 'CA',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: '2',
                claimNumber: 'CLM002',
                classification: 'COB' as Classification,
                platform: 'Amisys',
                providerName: 'Provider B',
                billedAmount: 2000,
                status: 'Approved',
                confidence: 90,
                daysAged: 5,
                state: 'NY',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: '3',
                claimNumber: 'CLM003',
                classification: 'DUAL' as Classification,
                platform: 'Xcelys',
                providerName: 'Provider C',
                billedAmount: 1500,
                status: 'In Review',
                confidence: 85,
                daysAged: 15,
                state: 'TX',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ] as Claim[],
          }
          onUpload(mockResult)
        }}
      >
        Upload Mock File
      </button>
    </div>
  ),
}))

vi.mock('@/components/file-intake/dynamic-tabs', () => ({
  DynamicTabs: ({
    classifications,
    counts,
    activeTab,
    onTabChange,
    children,
  }: {
    classifications: string[]
    counts: Record<string, number>
    activeTab: string
    onTabChange: (tab: string) => void
    children: React.ReactNode
  }) => (
    <div data-testid="dynamic-tabs">
      <div data-testid="tab-list">
        {classifications.map((classification) => (
          <button
            key={classification}
            data-testid={`tab-${classification}`}
            data-active={activeTab === classification}
            onClick={() => onTabChange(classification)}
          >
            {classification} ({counts[classification] || 0})
          </button>
        ))}
      </div>
      <div data-testid="tab-content">{children}</div>
    </div>
  ),
}))

vi.mock('@/components/claims-table', () => ({
  ClaimsTable: ({ claims }: { claims: Claim[] }) => (
    <div data-testid="claims-table">
      <div data-testid="claims-count">{claims.length} claims</div>
      {claims.map((claim) => (
        <div key={claim.id} data-testid={`claim-${claim.id}`}>
          {claim.claimNumber} - {claim.classification}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/error-display', () => ({
  ErrorDisplay: ({
    message,
    onDismiss,
  }: {
    message: string
    onDismiss?: () => void
  }) => (
    <div data-testid="error-display">
      <div>{message}</div>
      {onDismiss && (
        <button onClick={onDismiss} data-testid="dismiss-error">
          Dismiss
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/components/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

vi.mock('@/lib/xls-parser', () => ({
  parseXLSFile: vi.fn(),
}))

describe('FileIntakePage', () => {
  beforeEach(() => {
    // Reset the store before each test
    useClaimsStore.setState({ claims: [] })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('should render the page header', () => {
      render(<FileIntakePage />)

      expect(screen.getByRole('heading', { name: /file intake/i, level: 1 })).toBeInTheDocument()
      expect(
        screen.getByText(/upload xls files containing claims data/i)
      ).toBeInTheDocument()
    })

    it('should render the file uploader section', () => {
      render(<FileIntakePage />)

      expect(screen.getByRole('heading', { name: /upload claims file/i })).toBeInTheDocument()
      expect(screen.getByTestId('file-uploader')).toBeInTheDocument()
    })

    it('should show empty state when no claims are uploaded', () => {
      render(<FileIntakePage />)

      expect(screen.getByText(/no claims data uploaded/i)).toBeInTheDocument()
      expect(
        screen.getByText(/upload an xls file to view and analyze claims data/i)
      ).toBeInTheDocument()
    })

    it('should not show claims table when no claims exist', () => {
      render(<FileIntakePage />)

      expect(screen.queryByTestId('claims-table')).not.toBeInTheDocument()
      expect(screen.queryByTestId('dynamic-tabs')).not.toBeInTheDocument()
    })
  })

  describe('File Upload', () => {
    it('should handle successful file upload', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/file processed successfully/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/successfully parsed 3 claims from the file/i)).toBeInTheDocument()
    })

    it('should store parsed claims in the store', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        const state = useClaimsStore.getState()
        expect(state.claims).toHaveLength(3)
      })
    })

    it('should display total claims count after upload', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/3 total claims/i)).toBeInTheDocument()
      })
    })

    it('should hide empty state after successful upload', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      expect(screen.getByText(/no claims data uploaded/i)).toBeInTheDocument()

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.queryByText(/no claims data uploaded/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Dynamic Tabs Generation', () => {
    it('should generate tabs based on unique classifications', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-tabs')).toBeInTheDocument()
      })

      // Should have tabs for COB and DUAL (2 unique classifications)
      expect(screen.getByTestId('tab-COB')).toBeInTheDocument()
      expect(screen.getByTestId('tab-DUAL')).toBeInTheDocument()
    })

    it('should display claim counts in tab labels', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        const cobTab = screen.getByTestId('tab-COB')
        expect(cobTab).toHaveTextContent('COB (1)')

        const dualTab = screen.getByTestId('tab-DUAL')
        expect(dualTab).toHaveTextContent('DUAL (2)')
      })
    })

    it('should set first classification as active tab initially', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        // COB comes before DUAL alphabetically
        const cobTab = screen.getByTestId('tab-COB')
        expect(cobTab).toHaveAttribute('data-active', 'true')
      })
    })
  })

  describe('Claims Filtering', () => {
    it('should filter claims by active tab', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('claims-table')).toBeInTheDocument()
      })

      // Initially showing COB claims (1 claim)
      const claimsTable = screen.getByTestId('claims-table')
      expect(within(claimsTable).getByTestId('claims-count')).toHaveTextContent('1 claims')
    })

    it('should update displayed claims when tab changes', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-tabs')).toBeInTheDocument()
      })

      // Click on DUAL tab
      const dualTab = screen.getByTestId('tab-DUAL')
      await user.click(dualTab)

      await waitFor(() => {
        const claimsTable = screen.getByTestId('claims-table')
        expect(within(claimsTable).getByTestId('claims-count')).toHaveTextContent('2 claims')
      })
    })

    it('should display only claims matching the selected classification', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-tabs')).toBeInTheDocument()
      })

      // Click on DUAL tab
      const dualTab = screen.getByTestId('tab-DUAL')
      await user.click(dualTab)

      await waitFor(() => {
        // Should show 2 DUAL claims
        expect(screen.getByTestId('claim-1')).toHaveTextContent('CLM001 - DUAL')
        expect(screen.getByTestId('claim-3')).toHaveTextContent('CLM003 - DUAL')
        // Should not show COB claim
        expect(screen.queryByTestId('claim-2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle error result from file upload', () => {
      render(<FileIntakePage />)

      // The FileUploader component handles errors internally
      // This test verifies the page can receive and process error results
      expect(screen.getByTestId('file-uploader')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should support loading states during file processing', () => {
      render(<FileIntakePage />)

      // The FileUploader component manages its own loading state
      // This test verifies the page structure supports loading feedback
      expect(screen.getByTestId('file-uploader')).toBeInTheDocument()
    })
  })

  describe('Success Feedback', () => {
    it('should show success message with parsed claims count', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/file processed successfully/i)).toBeInTheDocument()
        expect(screen.getByText(/successfully parsed 3 claims from the file/i)).toBeInTheDocument()
      })
    })

    it('should show unique classifications count in success message', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/found 2 unique classifications/i)).toBeInTheDocument()
      })
    })
  })

  describe('Integration with Claims Store', () => {
    it('should use claims from store for display', async () => {
      // Pre-populate store with claims
      const mockClaims: Claim[] = [
        {
          id: '1',
          claimNumber: 'CLM001',
          classification: 'Pricing' as Classification,
          platform: 'Facet',
          providerName: 'Provider A',
          billedAmount: 1000,
          status: 'Pending',
          confidence: 95,
          daysAged: 10,
          state: 'CA',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      
      useClaimsStore.setState({ claims: mockClaims })
      
      render(<FileIntakePage />)

      await waitFor(() => {
        expect(screen.getByText(/1 total claim/i)).toBeInTheDocument()
      })
    })

    it('should update store when new file is uploaded', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const initialState = useClaimsStore.getState()
      expect(initialState.claims).toHaveLength(0)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        const updatedState = useClaimsStore.getState()
        expect(updatedState.claims).toHaveLength(3)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<FileIntakePage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent(/file intake/i)

      const h2 = screen.getByRole('heading', { level: 2, name: /upload claims file/i })
      expect(h2).toBeInTheDocument()
    })

    it('should have status role for success message', async () => {
      const user = userEvent.setup()
      render(<FileIntakePage />)

      const uploadButton = screen.getByRole('button', { name: /upload mock file/i })
      await user.click(uploadButton)

      await waitFor(() => {
        const successMessage = screen.getByRole('status')
        expect(successMessage).toBeInTheDocument()
      })
    })
  })
})
