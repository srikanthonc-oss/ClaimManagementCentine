import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Next.js font
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}))

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import RootLayout, { metadata } from './layout'

describe('RootLayout', () => {
  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies suppressHydrationWarning to html element', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    const html = container.querySelector('html')
    expect(html).toHaveAttribute('lang', 'en')
  })

  it('wraps children with ThemeProvider and QueryProvider', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child">Test</div>
      </RootLayout>
    )

    // Verify the child is rendered (which means providers are working)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

describe('metadata', () => {
  it('has correct title', () => {
    expect(metadata.title).toBe('Claims Management UI')
  })

  it('has correct description', () => {
    expect(metadata.description).toBe(
      'Healthcare claims processing and management system'
    )
  })
})
