import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PendProcessingPage from './page'
import { useUIStore } from '@/stores/ui-store'
import type { Claim } from '@/types'
import { generateMockClaims } from '@/lib/mock-data'

// Mock the components
vi.mock('@/components/pend-processing/platform-filter', () => ({
  PlatformFilter: () => <div data-testid="platform-filter">Platform Filter</div>,
}))

vi.mock('@/components/pend-processing/classification-group', () => ({
  ClassificationGroup: ({ classification, claims, expanded }: any) => (
    <div data-testid={`classification-group-${classification}`}>
      <div>{classification}</div>
      <div>{claims.length} claims</div>
      <div>{expanded ? 'Expanded' : 'Collapsed'}</div>
    </div>
  ),
}))

vi.mock('@/components/error-display', () => ({
  ErrorDisplay: ({ title, message, onRetry }: any) => (
    <div data-testid="error-display">
      <div>{title}</div>
      <div>{message}</div>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}))

vi.mock('@/components/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

vi.mock('@/lib/mock-data')

// Helper to create mock claims
function createMockClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: Math.random().toString(),
    claimNumber: `CLM-${Math.random().toString().slice(2, 8)}`,
    classification: 'DUAL',
    platform: 'Facet',
    providerName: 'Test Provider',
    billedAmount: 1000,
    status: 'Pending',
    confidence: 85,
    daysAged: 10,
    state: 'CA',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('PendProcessingPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Reset UI store state
    useUIStore.setState({
      selectedPlatforms: [],
      expandedGroups: new Set(),
      searchQuery: '',
    })

    // Create a new query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PendProcessingPage />
      </QueryClientProvider>
    )
  }

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      mockvi.mocked(generateMockClaims).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderPage()

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Pend Processing')).toBeInTheDocument()
    })

    it('should display sidebar skeleton during loading', () => {
      mockvi.mocked(generateMockClaims).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderPage()

      // Check for loading state elements
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      mockvi.mocked(generateMockClaims).mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument()
      })

      expect(screen.getByText('Failed to load pending claims')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('should display platform filter in error state', async () => {
      mockvi.mocked(generateMockClaims).mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('platform-filter')).toBeInTheDocument()
      })
    })

    it('should allow retry on error', async () => {
      mockvi.mocked(generateMockClaims).mockRejectedValueOnce(new Error('Network error'))
      mockvi.mocked(generateMockClaims).mockResolvedValueOnce([])

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      await userEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no pending claims exist', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([])

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('No pending claims')).toBeInTheDocument()
      })

      expect(screen.getByText('All claims have been processed. Great work!')).toBeInTheDocument()
    })

    it('should display platform filter in empty state', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([])

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('platform-filter')).toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    it('should fetch and display pending claims', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ classification: 'DUAL', status: 'Pending' }),
        createMockClaim({ classification: 'COB', status: 'In Review' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Pend Processing')).toBeInTheDocument()
      })

      // Should display claim count
      expect(screen.getByText(/2 claims/)).toBeInTheDocument()
    })

    it('should filter claims to only show Pending and In Review statuses', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ status: 'Pending' }),
        createMockClaim({ status: 'In Review' }),
        createMockClaim({ status: 'Approved' }),
        createMockClaim({ status: 'Denied' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        // Should only show 2 claims (Pending and In Review)
        expect(screen.getByText(/2 claims/)).toBeInTheDocument()
      })
    })

    it('should group claims by classification', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ classification: 'DUAL', status: 'Pending' }),
        createMockClaim({ classification: 'DUAL', status: 'Pending' }),
        createMockClaim({ classification: 'COB', status: 'In Review' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('classification-group-DUAL')).toBeInTheDocument()
        expect(screen.getByTestId('classification-group-COB')).toBeInTheDocument()
      })

      // Check claim counts in groups
      const dualGroup = screen.getByTestId('classification-group-DUAL')
      expect(dualGroup).toHaveTextContent('2 claims')

      const cobGroup = screen.getByTestId('classification-group-COB')
      expect(cobGroup).toHaveTextContent('1 claims')
    })

    it('should sort classification groups alphabetically', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ classification: 'Pricing', status: 'Pending' }),
        createMockClaim({ classification: 'Auth', status: 'Pending' }),
        createMockClaim({ classification: 'DUAL', status: 'Pending' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        const groups = screen.getAllByTestId(/classification-group-/)
        expect(groups).toHaveLength(3)
      })

      // Groups should be in alphabetical order
      const groups = screen.getAllByTestId(/classification-group-/)
      expect(groups[0]).toHaveAttribute('data-testid', 'classification-group-Auth')
      expect(groups[1]).toHaveAttribute('data-testid', 'classification-group-DUAL')
      expect(groups[2]).toHaveAttribute('data-testid', 'classification-group-Pricing')
    })

    it('should not display classification groups with no claims', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ classification: 'DUAL', status: 'Pending' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('classification-group-DUAL')).toBeInTheDocument()
      })

      // Should not display empty groups
      expect(screen.queryByTestId('classification-group-COB')).not.toBeInTheDocument()
      expect(screen.queryByTestId('classification-group-Pricing')).not.toBeInTheDocument()
    })
  })

  describe('Platform Filtering', () => {
    it('should display platform filter component', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([
        createMockClaim({ status: 'Pending' }),
      ])

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('platform-filter')).toBeInTheDocument()
      })
    })

    it('should update claim count when platforms are selected', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ platform: 'Facet', status: 'Pending' }),
        createMockClaim({ platform: 'Amisys', status: 'Pending' }),
        createMockClaim({ platform: 'Xcelys', status: 'Pending' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/3 claims/)).toBeInTheDocument()
      })

      // Simulate platform filter selection
      useUIStore.setState({ selectedPlatforms: ['Facet'] })

      await waitFor(() => {
        expect(screen.getByText(/Filtered by: Facet/)).toBeInTheDocument()
      })
    })

    it('should show clear filters button when platforms are selected', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([
        createMockClaim({ status: 'Pending' }),
      ])

      renderPage()

      await waitFor(() => {
        expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument()
      })

      // Select a platform
      useUIStore.setState({ selectedPlatforms: ['Facet'] })

      await waitFor(() => {
        expect(screen.getAllByText('Clear Filters')).toHaveLength(2) // One in sidebar, one in empty state
      })
    })

    it('should display empty state when no claims match filters', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ platform: 'Facet', status: 'Pending' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/1 claim/)).toBeInTheDocument()
      })

      // Select a different platform
      useUIStore.setState({ selectedPlatforms: ['Amisys'] })

      await waitFor(() => {
        expect(screen.getByText('No claims match the selected filters')).toBeInTheDocument()
      })
    })
  })

  describe('Group Expansion', () => {
    it('should pass expanded state to classification groups', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = [
        createMockClaim({ classification: 'DUAL', status: 'Pending' }),
      ]
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        const group = screen.getByTestId('classification-group-DUAL')
        expect(group).toHaveTextContent('Collapsed')
      })

      // Expand the group
      useUIStore.setState({ expandedGroups: new Set(['DUAL']) })

      await waitFor(() => {
        const group = screen.getByTestId('classification-group-DUAL')
        expect(group).toHaveTextContent('Expanded')
      })
    })

    it('should display expand all button', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([
        createMockClaim({ status: 'Pending' }),
      ])

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Expand All')).toBeInTheDocument()
      })
    })

    it('should display collapse all button', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([
        createMockClaim({ status: 'Pending' }),
      ])

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Collapse All')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should display mobile filter button on small screens', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([
        createMockClaim({ status: 'Pending' }),
      ])

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Show Filters')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = Array.from({ length: 1000 }, (_, i) =>
        createMockClaim({
          id: `claim-${i}`,
          classification: ['DUAL', 'COB', 'Pricing'][i % 3] as any,
          status: 'Pending',
        })
      )
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      const startTime = performance.now()
      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/1000 claims/)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within 2 seconds (requirement 12.1)
      expect(renderTime).toBeLessThan(2000)
    })

    it('should update display within 500ms when filters change', async () => {
      // Using mockGenerateMockClaims
      const mockClaims = Array.from({ length: 100 }, (_, i) =>
        createMockClaim({
          id: `claim-${i}`,
          platform: ['Facet', 'Amisys', 'Xcelys'][i % 3] as any,
          status: 'Pending',
        })
      )
      vi.mocked(generateMockClaims).mockResolvedValue(mockClaims)

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/100 claims/)).toBeInTheDocument()
      })

      const startTime = performance.now()
      useUIStore.setState({ selectedPlatforms: ['Facet'] })

      await waitFor(() => {
        expect(screen.getByText(/Filtered by: Facet/)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const filterTime = endTime - startTime

      // Should update within 500ms (requirement 12.2)
      expect(filterTime).toBeLessThan(500)
    })
  })

  describe('Auto-refresh', () => {
    it('should configure auto-refresh every 30 seconds', async () => {
      // Using mockGenerateMockClaims
      vi.mocked(generateMockClaims).mockResolvedValue([
        createMockClaim({ status: 'Pending' }),
      ])

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Pend Processing')).toBeInTheDocument()
      })

      // Query should be configured with refetchInterval
      const queries = queryClient.getQueryCache().getAll()
      const pendingClaimsQuery = queries.find(q => 
        JSON.stringify(q.queryKey) === JSON.stringify(['pending-claims'])
      )

      expect(pendingClaimsQuery?.options.refetchInterval).toBe(30000)
    })
  })
})
