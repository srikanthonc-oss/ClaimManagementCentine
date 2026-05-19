import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import DashboardPage from './page'
import type { Claim } from '@/types'

// Helper to create mock claims
function createMockClaims(count: number): Claim[] {
  const claims: Claim[] = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    claims.push({
      id: `claim-${i + 1}`,
      claimNumber: `CLM${String(100000 + i).padStart(6, '0')}`,
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Test Provider',
      billedAmount: 1000 + i,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: now,
      updatedAt: now,
    })
  }
  
  return claims
}

// Helper to render with QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    // Clear any cached query data
  })

  it('renders dashboard title and description', () => {
    renderWithQueryClient(<DashboardPage />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Comprehensive overview of claims processing metrics')).toBeInTheDocument()
  })

  it('shows loading spinner while fetching data', () => {
    renderWithQueryClient(<DashboardPage />)
    
    // Loading spinner should be visible initially
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays metrics cards when data is loaded', async () => {
    renderWithQueryClient(<DashboardPage />)
    
    // Wait for data to load (mock data is generated automatically)
    await waitFor(() => {
      expect(screen.getByText('Total Claims')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check that key metrics are displayed
    expect(screen.getByText('Pending Claims')).toBeInTheDocument()
    expect(screen.getByText('Approved Claims')).toBeInTheDocument()
    expect(screen.getByText('Denied Claims')).toBeInTheDocument()
    expect(screen.getByText('Total Billed Amount')).toBeInTheDocument()
    expect(screen.getByText('Average Billed Amount')).toBeInTheDocument()
    expect(screen.getByText('Average Days Aged')).toBeInTheDocument()
  })

  it('displays platform metrics', async () => {
    renderWithQueryClient(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Claims by Platform')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check platform cards
    const facetCards = screen.getAllByText('Facet')
    const amisysCards = screen.getAllByText('Amisys')
    const xcelysCards = screen.getAllByText('Xcelys')
    
    expect(facetCards.length).toBeGreaterThan(0)
    expect(amisysCards.length).toBeGreaterThan(0)
    expect(xcelysCards.length).toBeGreaterThan(0)
  })

  it('displays classification metrics', async () => {
    renderWithQueryClient(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Claims by Classification')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check some classification cards
    expect(screen.getByText('DUAL')).toBeInTheDocument()
    expect(screen.getByText('Duplicate')).toBeInTheDocument()
    expect(screen.getByText('COB')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
  })

  it('displays status metrics', async () => {
    renderWithQueryClient(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Claims by Status')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check status cards (some may appear multiple times in different sections)
    const pendingCards = screen.getAllByText('Pending')
    const approvedCards = screen.getAllByText('Approved')
    const deniedCards = screen.getAllByText('Denied')
    const inReviewCards = screen.getAllByText('In Review')
    
    expect(pendingCards.length).toBeGreaterThan(0)
    expect(approvedCards.length).toBeGreaterThan(0)
    expect(deniedCards.length).toBeGreaterThan(0)
    expect(inReviewCards.length).toBeGreaterThan(0)
  })

  it('displays last updated timestamp', async () => {
    renderWithQueryClient(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText(/Auto-refreshes every 30 seconds/)).toBeInTheDocument()
  })
})
