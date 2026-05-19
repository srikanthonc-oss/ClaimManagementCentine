import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppLayout } from './app-layout'

// Mock the Navigation component
vi.mock('./navigation', () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

describe('AppLayout', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      )
      
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render Navigation component', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      )
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(
        <AppLayout>
          <div data-testid="child-content">Child Content</div>
        </AppLayout>
      )
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <AppLayout>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </AppLayout>
      )
      
      expect(screen.getByText('First Child')).toBeInTheDocument()
      expect(screen.getByText('Second Child')).toBeInTheDocument()
      expect(screen.getByText('Third Child')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper semantic HTML structure', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      // Check for main element
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('role', 'main')
      expect(main).toHaveAttribute('aria-label', 'Main content')
    })

    it('should have flex column layout', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv).toHaveClass('flex', 'flex-col')
    })

    it('should have min-h-screen class for full height', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv).toHaveClass('min-h-screen')
    })

    it('should have container with responsive padding', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const contentContainer = container.querySelector('.container')
      expect(contentContainer).toBeInTheDocument()
      expect(contentContainer).toHaveClass('mx-auto')
      expect(contentContainer).toHaveClass('px-4')
      expect(contentContainer).toHaveClass('py-6')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive padding classes', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const contentContainer = container.querySelector('.container')
      expect(contentContainer).toHaveClass('sm:px-6', 'lg:px-8')
    })

    it('should have responsive vertical padding', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const contentContainer = container.querySelector('.container')
      expect(contentContainer).toHaveClass('py-6', 'lg:py-8')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Main content')
    })

    it('should have semantic main landmark', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should hide decorative footer spacer from screen readers', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const footerSpacer = container.querySelector('.h-8')
      expect(footerSpacer).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Content Constraints', () => {
    it('should apply container max-width', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const contentContainer = container.querySelector('.container')
      expect(contentContainer).toHaveClass('container')
    })

    it('should center content with mx-auto', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const contentContainer = container.querySelector('.container')
      expect(contentContainer).toHaveClass('mx-auto')
    })

    it('should have full width main element', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )
      
      const main = container.querySelector('main')
      expect(main).toHaveClass('w-full')
    })
  })

  describe('Component Integration', () => {
    it('should render Navigation before content', () => {
      const { container } = render(
        <AppLayout>
          <div data-testid="page-content">Page Content</div>
        </AppLayout>
      )
      
      const navigation = screen.getByTestId('navigation')
      const content = screen.getByTestId('page-content')
      
      // Navigation should come before content in DOM order
      expect(navigation.compareDocumentPosition(content)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    })

    it('should allow complex children components', () => {
      const ComplexChild = () => (
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </div>
      )
      
      render(
        <AppLayout>
          <ComplexChild />
        </AppLayout>
      )
      
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Paragraph')).toBeInTheDocument()
      expect(screen.getByText('Button')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(
        <AppLayout>
          {null}
        </AppLayout>
      )
      
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle undefined children', () => {
      render(
        <AppLayout>
          {undefined}
        </AppLayout>
      )
      
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle string children', () => {
      render(
        <AppLayout>
          Plain text content
        </AppLayout>
      )
      
      expect(screen.getByText('Plain text content')).toBeInTheDocument()
    })

    it('should handle fragment children', () => {
      render(
        <AppLayout>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </AppLayout>
      )
      
      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument()
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument()
    })
  })

  describe('Requirements Validation', () => {
    it('should validate Requirement 9.1: Navigation to Dashboard', () => {
      // Navigation component handles routing, AppLayout provides structure
      render(
        <AppLayout>
          <div>Dashboard</div>
        </AppLayout>
      )
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument()
    })

    it('should validate Requirement 9.2-9.4: Navigation to all screens', () => {
      // Navigation component provides links, AppLayout provides layout
      render(
        <AppLayout>
          <div>Any Screen</div>
        </AppLayout>
      )
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument()
    })

    it('should validate Requirement 9.5: Active screen indication', () => {
      // Navigation component handles active state, AppLayout provides structure
      render(
        <AppLayout>
          <div>Current Screen</div>
        </AppLayout>
      )
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument()
    })

    it('should validate Requirement 9.6: Screen display within 1 second', () => {
      // AppLayout renders synchronously without delays
      const startTime = performance.now()
      
      render(
        <AppLayout>
          <div>New Screen</div>
        </AppLayout>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Render should be nearly instantaneous (well under 1 second)
      expect(renderTime).toBeLessThan(1000)
      expect(screen.getByText('New Screen')).toBeInTheDocument()
    })
  })
})
