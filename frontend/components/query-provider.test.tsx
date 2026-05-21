import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryProvider } from './query-provider'
import { useQuery } from '@tanstack/react-query'

// Test component that uses React Query
function TestComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: async () => 'test data',
  })

  if (isLoading) return <div>Loading...</div>
  return <div>{data}</div>
}

describe('QueryProvider', () => {
  it('renders children correctly', () => {
    render(
      <QueryProvider>
        <div>Test Content</div>
      </QueryProvider>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('provides QueryClient context to children', async () => {
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    )

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Eventually shows the data
    expect(await screen.findByText('test data')).toBeInTheDocument()
  })

  it('creates a stable QueryClient instance', () => {
    const { rerender } = render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    )

    // Rerender should not create a new QueryClient
    rerender(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    )

    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
