import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClaimsTable } from './claims-table'
import type { Claim } from '@/types'

// Mock the useDebounce hook
vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value, // Return value immediately for testing
}))

// Mock the virtual scrolling library
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
      index,
      start: index * 57,
      size: 57,
      key: index,
    })),
    getTotalSize: () => count * 57,
  }),
}))

const mockClaims: Claim[] = [
  {
    id: '1',
    claimNumber: 'CLM-001',
    classification: 'DUAL',
    platform: 'Facet',
    providerName: 'Dr. Smith',
    billedAmount: 1500.0,
    status: 'Pending',
    confidence: 85.5,
    daysAged: 5,
    state: 'CA',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '2',
    claimNumber: 'CLM-002',
    classification: 'Duplicate',
    platform: 'Amisys',
    providerName: 'Dr. Johnson',
    billedAmount: 2500.0,
    status: 'Approved',
    confidence: 92.3,
    daysAged: 10,
    state: 'NY',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-06'),
  },
  {
    id: '3',
    claimNumber: 'CLM-003',
    classification: 'COB',
    platform: 'Xcelys',
    providerName: 'Dr. Williams',
    billedAmount: 3500.0,
    status: 'Denied',
    confidence: 78.9,
    daysAged: 15,
    state: 'TX',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-07'),
  },
]

describe('ClaimsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the table with all claims', () => {
      render(<ClaimsTable claims={mockClaims} />)

      // Check that all claim numbers are displayed
      expect(screen.getByText('CLM-001')).toBeInTheDocument()
      expect(screen.getByText('CLM-002')).toBeInTheDocument()
      expect(screen.getByText('CLM-003')).toBeInTheDocument()
    })

    it('should render all column headers', () => {
      render(<ClaimsTable claims={mockClaims} />)

      expect(screen.getByText('Claim Number')).toBeInTheDocument()
      expect(screen.getByText('Classification')).toBeInTheDocument()
      expect(screen.getByText('Platform')).toBeInTheDocument()
      expect(screen.getByText('Provider Name')).toBeInTheDocument()
      expect(screen.getByText('Billed Amount')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Confidence')).toBeInTheDocument()
      expect(screen.getByText('Days Aged')).toBeInTheDocument()
      expect(screen.getByText('State')).toBeInTheDocument()
    })

    it('should display formatted currency for billed amounts', () => {
      render(<ClaimsTable claims={mockClaims} />)

      expect(screen.getByText('$1,500.00')).toBeInTheDocument()
      expect(screen.getByText('$2,500.00')).toBeInTheDocument()
      expect(screen.getByText('$3,500.00')).toBeInTheDocument()
    })

    it('should display formatted confidence percentages', () => {
      render(<ClaimsTable claims={mockClaims} />)

      expect(screen.getByText('85.5%')).toBeInTheDocument()
      expect(screen.getByText('92.3%')).toBeInTheDocument()
      expect(screen.getByText('78.9%')).toBeInTheDocument()
    })

    it('should display status badges with appropriate styling', () => {
      render(<ClaimsTable claims={mockClaims} />)

      const pendingBadge = screen.getByText('Pending')
      const approvedBadge = screen.getByText('Approved')
      const deniedBadge = screen.getByText('Denied')

      expect(pendingBadge).toBeInTheDocument()
      expect(approvedBadge).toBeInTheDocument()
      expect(deniedBadge).toBeInTheDocument()
    })

    it('should display empty state when no claims provided', () => {
      render(<ClaimsTable claims={[]} />)

      expect(screen.getByText('No claims to display')).toBeInTheDocument()
    })

    it('should display claim count', () => {
      render(<ClaimsTable claims={mockClaims} />)

      expect(screen.getByText('3 of 3 claims')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<ClaimsTable claims={mockClaims} />)

      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      expect(searchInput).toBeInTheDocument()
    })

    it('should filter claims by claim number', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      await user.type(searchInput, 'CLM-001')

      // Should show only the matching claim
      expect(screen.getByText('CLM-001')).toBeInTheDocument()
      expect(screen.queryByText('CLM-002')).not.toBeInTheDocument()
      expect(screen.queryByText('CLM-003')).not.toBeInTheDocument()
    })

    it('should filter claims by provider name', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      await user.type(searchInput, 'Johnson')

      // Should show only the matching claim
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Dr. Williams')).not.toBeInTheDocument()
    })

    it('should be case-insensitive when searching', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      await user.type(searchInput, 'smith')

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
    })

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText(/No claims found matching "nonexistent"/)).toBeInTheDocument()
    })

    it('should update claim count when filtering', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      await user.type(searchInput, 'CLM-001')

      expect(screen.getByText('1 of 3 claims')).toBeInTheDocument()
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort by claim number in ascending order', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const claimNumberHeader = screen.getByText('Claim Number')
      await user.click(claimNumberHeader)

      // Check that claims are in ascending order
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('CLM-001')
      expect(rows[2]).toHaveTextContent('CLM-002')
      expect(rows[3]).toHaveTextContent('CLM-003')
    })

    it('should sort by claim number in descending order on second click', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const claimNumberHeader = screen.getByText('Claim Number')
      await user.click(claimNumberHeader) // First click: ascending
      await user.click(claimNumberHeader) // Second click: descending

      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('CLM-003')
      expect(rows[2]).toHaveTextContent('CLM-002')
      expect(rows[3]).toHaveTextContent('CLM-001')
    })

    it('should clear sorting on third click', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const claimNumberHeader = screen.getByText('Claim Number')
      await user.click(claimNumberHeader) // First click: ascending
      await user.click(claimNumberHeader) // Second click: descending
      await user.click(claimNumberHeader) // Third click: clear

      // Should return to original order
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('CLM-001')
    })

    it('should sort by billed amount numerically', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const billedAmountHeader = screen.getByText('Billed Amount')
      await user.click(billedAmountHeader)

      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('$1,500.00')
      expect(rows[2]).toHaveTextContent('$2,500.00')
      expect(rows[3]).toHaveTextContent('$3,500.00')
    })

    it('should sort by confidence numerically', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const confidenceHeader = screen.getByText('Confidence')
      await user.click(confidenceHeader)

      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('78.9%')
      expect(rows[2]).toHaveTextContent('85.5%')
      expect(rows[3]).toHaveTextContent('92.3%')
    })

    it('should sort by days aged numerically', async () => {
      const user = userEvent.setup()
      render(<ClaimsTable claims={mockClaims} />)

      const daysAgedHeader = screen.getByText('Days Aged')
      await user.click(daysAgedHeader)

      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('5 days')
      expect(rows[2]).toHaveTextContent('10 days')
      expect(rows[3]).toHaveTextContent('15 days')
    })
  })

  describe('Combined Search and Sort', () => {
    it('should apply sorting to filtered results', async () => {
      const user = userEvent.setup()
      const claims: Claim[] = [
        ...mockClaims,
        {
          id: '4',
          claimNumber: 'CLM-004',
          classification: 'DUAL',
          platform: 'Facet',
          providerName: 'Dr. Smith',
          billedAmount: 500.0,
          status: 'Pending',
          confidence: 95.0,
          daysAged: 2,
          state: 'FL',
          createdAt: new Date('2024-01-04'),
          updatedAt: new Date('2024-01-08'),
        },
      ]

      render(<ClaimsTable claims={claims} />)

      // Filter by provider name
      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      await user.type(searchInput, 'Smith')

      // Should show 2 claims (CLM-001 and CLM-004)
      expect(screen.getByText('2 of 4 claims')).toBeInTheDocument()

      // Sort by billed amount
      const billedAmountHeader = screen.getByText('Billed Amount')
      await user.click(billedAmountHeader)

      // Check that filtered results are sorted
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('$500.00')
      expect(rows[2]).toHaveTextContent('$1,500.00')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(<ClaimsTable claims={mockClaims} />)

      const searchInput = screen.getByPlaceholderText(
        'Search by claim number or provider name...'
      )
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('should have clickable column headers for sorting', () => {
      render(<ClaimsTable claims={mockClaims} />)

      const headers = [
        'Claim Number',
        'Classification',
        'Platform',
        'Provider Name',
        'Billed Amount',
        'Status',
        'Confidence',
        'Days Aged',
        'State',
      ]

      headers.forEach((header) => {
        const headerElement = screen.getByText(header)
        expect(headerElement.closest('button')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeClaims: Claim[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        claimNumber: `CLM-${String(i + 1).padStart(4, '0')}`,
        classification: 'DUAL',
        platform: 'Facet',
        providerName: `Provider ${i + 1}`,
        billedAmount: Math.random() * 10000,
        status: 'Pending',
        confidence: Math.random() * 100,
        daysAged: Math.floor(Math.random() * 30),
        state: 'CA',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      const { container } = render(<ClaimsTable claims={largeClaims} />)

      // Should render without errors
      expect(container).toBeInTheDocument()
      expect(screen.getByText('1000 of 1000 claims')).toBeInTheDocument()
    })
  })
})
