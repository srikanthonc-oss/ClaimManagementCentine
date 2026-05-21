import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlatformFilter } from './platform-filter'
import { useUIStore } from '@/stores/ui-store'
import { useClaimsStore } from '@/stores/claims-store'
import type { Claim, Platform } from '@/types'

// Mock the stores
vi.mock('@/stores/ui-store')
vi.mock('@/stores/claims-store')

describe('PlatformFilter', () => {
  // Mock functions
  const mockTogglePlatform = vi.fn()
  
  // Mock claims data
  const mockClaims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Provider A',
      billedAmount: 1000,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      claimNumber: 'CLM002',
      classification: 'Duplicate',
      platform: 'Facet',
      providerName: 'Provider B',
      billedAmount: 2000,
      status: 'Pending',
      confidence: 90,
      daysAged: 5,
      state: 'NY',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      claimNumber: 'CLM003',
      classification: 'COB',
      platform: 'Amisys',
      providerName: 'Provider C',
      billedAmount: 1500,
      status: 'In Review',
      confidence: 75,
      daysAged: 15,
      state: 'TX',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
    {
      id: '4',
      claimNumber: 'CLM004',
      classification: 'Pricing',
      platform: 'Xcelys',
      providerName: 'Provider D',
      billedAmount: 3000,
      status: 'Pending',
      confidence: 95,
      daysAged: 3,
      state: 'FL',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04'),
    },
  ]

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup default mock implementations
    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        selectedPlatforms: [] as Platform[],
        togglePlatform: mockTogglePlatform,
      }
      return selector(state)
    })

    vi.mocked(useClaimsStore).mockImplementation((selector: any) => {
      const state = {
        claims: mockClaims,
        getCountByPlatform: () => ({
          Facet: 2,
          Amisys: 1,
          Xcelys: 1,
        }),
      }
      return selector(state)
    })
  })

  describe('Rendering', () => {
    it('should render the component with title', () => {
      render(<PlatformFilter />)
      expect(screen.getByText('Filter by Platform')).toBeInTheDocument()
    })

    it('should render all three platform checkboxes', () => {
      render(<PlatformFilter />)
      expect(screen.getByLabelText(/Filter by Facet platform/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Filter by Amisys platform/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Filter by Xcelys platform/i)).toBeInTheDocument()
    })

    it('should display platform names', () => {
      render(<PlatformFilter />)
      expect(screen.getByText('Facet')).toBeInTheDocument()
      expect(screen.getByText('Amisys')).toBeInTheDocument()
      expect(screen.getByText('Xcelys')).toBeInTheDocument()
    })

    it('should display claim counts for each platform', () => {
      render(<PlatformFilter />)
      expect(screen.getByText('(2)')).toBeInTheDocument() // Facet count
      expect(screen.getAllByText('(1)').length).toBe(2) // Amisys and Xcelys counts
    })

    it('should apply custom className when provided', () => {
      const { container } = render(<PlatformFilter className="custom-class" />)
      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Checkbox State', () => {
    it('should show all checkboxes as unchecked when no platforms are selected', () => {
      render(<PlatformFilter />)
      const facetCheckbox = screen.getByLabelText(/Filter by Facet platform/i)
      const amisysCheckbox = screen.getByLabelText(/Filter by Amisys platform/i)
      const xcelysCheckbox = screen.getByLabelText(/Filter by Xcelys platform/i)

      expect(facetCheckbox).not.toBeChecked()
      expect(amisysCheckbox).not.toBeChecked()
      expect(xcelysCheckbox).not.toBeChecked()
    })

    it('should show selected platforms as checked', () => {
      vi.mocked(useUIStore).mockImplementation((selector: any) => {
        const state = {
          selectedPlatforms: ['Facet', 'Xcelys'] as Platform[],
          togglePlatform: mockTogglePlatform,
        }
        return selector(state)
      })

      render(<PlatformFilter />)
      const facetCheckbox = screen.getByLabelText(/Filter by Facet platform/i)
      const amisysCheckbox = screen.getByLabelText(/Filter by Amisys platform/i)
      const xcelysCheckbox = screen.getByLabelText(/Filter by Xcelys platform/i)

      expect(facetCheckbox).toBeChecked()
      expect(amisysCheckbox).not.toBeChecked()
      expect(xcelysCheckbox).toBeChecked()
    })
  })

  describe('User Interactions', () => {
    it('should call togglePlatform when Facet checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<PlatformFilter />)

      const facetCheckbox = screen.getByLabelText(/Filter by Facet platform/i)
      await user.click(facetCheckbox)

      expect(mockTogglePlatform).toHaveBeenCalledWith('Facet')
      expect(mockTogglePlatform).toHaveBeenCalledTimes(1)
    })

    it('should call togglePlatform when Amisys checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<PlatformFilter />)

      const amisysCheckbox = screen.getByLabelText(/Filter by Amisys platform/i)
      await user.click(amisysCheckbox)

      expect(mockTogglePlatform).toHaveBeenCalledWith('Amisys')
      expect(mockTogglePlatform).toHaveBeenCalledTimes(1)
    })

    it('should call togglePlatform when Xcelys checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<PlatformFilter />)

      const xcelysCheckbox = screen.getByLabelText(/Filter by Xcelys platform/i)
      await user.click(xcelysCheckbox)

      expect(mockTogglePlatform).toHaveBeenCalledWith('Xcelys')
      expect(mockTogglePlatform).toHaveBeenCalledTimes(1)
    })

    it('should call togglePlatform when clicking on the label', async () => {
      const user = userEvent.setup()
      render(<PlatformFilter />)

      const facetLabel = screen.getByText('Facet')
      await user.click(facetLabel)

      expect(mockTogglePlatform).toHaveBeenCalledWith('Facet')
    })

    it('should support multiple platform selections', async () => {
      const user = userEvent.setup()
      render(<PlatformFilter />)

      const facetCheckbox = screen.getByLabelText(/Filter by Facet platform/i)
      const amisysCheckbox = screen.getByLabelText(/Filter by Amisys platform/i)

      await user.click(facetCheckbox)
      await user.click(amisysCheckbox)

      expect(mockTogglePlatform).toHaveBeenCalledWith('Facet')
      expect(mockTogglePlatform).toHaveBeenCalledWith('Amisys')
      expect(mockTogglePlatform).toHaveBeenCalledTimes(2)
    })
  })

  describe('Claim Counts', () => {
    it('should display zero counts when no claims exist', () => {
      vi.mocked(useClaimsStore).mockImplementation((selector: any) => {
        const state = {
          claims: [],
          getCountByPlatform: () => ({
            Facet: 0,
            Amisys: 0,
            Xcelys: 0,
          }),
        }
        return selector(state)
      })

      render(<PlatformFilter />)
      expect(screen.getAllByText('(0)').length).toBe(3)
    })

    it('should update counts when claims data changes', () => {
      const { rerender } = render(<PlatformFilter />)
      expect(screen.getByText('(2)')).toBeInTheDocument() // Facet

      // Update mock to return different counts
      vi.mocked(useClaimsStore).mockImplementation((selector: any) => {
        const state = {
          claims: mockClaims,
          getCountByPlatform: () => ({
            Facet: 5,
            Amisys: 3,
            Xcelys: 2,
          }),
        }
        return selector(state)
      })

      rerender(<PlatformFilter />)
      expect(screen.getByText('(5)')).toBeInTheDocument() // Updated Facet count
      expect(screen.getByText('(3)')).toBeInTheDocument() // Updated Amisys count
      expect(screen.getByText('(2)')).toBeInTheDocument() // Updated Xcelys count
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      render(<PlatformFilter />)
      expect(screen.getByLabelText('Filter by Facet platform (2 claims)')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by Amisys platform (1 claims)')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by Xcelys platform (1 claims)')).toBeInTheDocument()
    })

    it('should associate labels with checkboxes using htmlFor', () => {
      render(<PlatformFilter />)
      const facetCheckbox = screen.getByLabelText(/Filter by Facet platform/i)
      expect(facetCheckbox).toHaveAttribute('id', 'platform-facet')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<PlatformFilter />)

      const facetCheckbox = screen.getByLabelText(/Filter by Facet platform/i)
      
      // Tab to focus and press Space to toggle
      await user.tab()
      expect(facetCheckbox).toHaveFocus()

      await user.keyboard(' ')
      expect(mockTogglePlatform).toHaveBeenCalledWith('Facet')
    })
  })

  describe('Integration with UI Store', () => {
    it('should read selectedPlatforms from UI store', () => {
      const mockSelector = vi.fn((selector: any) => {
        const state = {
          selectedPlatforms: ['Facet'] as Platform[],
          togglePlatform: mockTogglePlatform,
        }
        return selector(state)
      })
      vi.mocked(useUIStore).mockImplementation(mockSelector)

      render(<PlatformFilter />)
      expect(mockSelector).toHaveBeenCalled()
    })

    it('should use togglePlatform action from UI store', async () => {
      const user = userEvent.setup()
      render(<PlatformFilter />)

      const facetCheckbox = screen.getByLabelText(/Filter by Facet platform/i)
      await user.click(facetCheckbox)

      expect(mockTogglePlatform).toHaveBeenCalledWith('Facet')
    })
  })

  describe('Integration with Claims Store', () => {
    it('should read platform counts from claims store', () => {
      const mockSelector = vi.fn((selector: any) => {
        const state = {
          claims: mockClaims,
          getCountByPlatform: () => ({
            Facet: 2,
            Amisys: 1,
            Xcelys: 1,
          }),
        }
        return selector(state)
      })
      vi.mocked(useClaimsStore).mockImplementation(mockSelector)

      render(<PlatformFilter />)
      expect(mockSelector).toHaveBeenCalled()
    })
  })
})
