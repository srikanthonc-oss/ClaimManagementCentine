import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './loading-spinner'

describe('LoadingSpinner', () => {
  describe('Basic Rendering', () => {
    it('should render the spinner without text', () => {
      render(<LoadingSpinner />)
      
      // Check for the status role
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      
      // Check for default screen reader text
      expect(screen.getByText('Loading...', { selector: '.sr-only' })).toBeInTheDocument()
    })

    it('should render the spinner with custom text', () => {
      const loadingText = 'Loading claims data...'
      render(<LoadingSpinner text={loadingText} />)
      
      // Check for visible text
      expect(screen.getByText(loadingText, { selector: 'p' })).toBeInTheDocument()
      
      // Check for screen reader text
      expect(screen.getByText(loadingText, { selector: '.sr-only' })).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should render small size spinner', () => {
      render(<LoadingSpinner size="sm" />)
      const spinner = screen.getByRole('status')
      
      // Check that the spinner icon has the small size class
      const icon = spinner.querySelector('svg')
      expect(icon).toHaveClass('h-4', 'w-4')
    })

    it('should render default size spinner', () => {
      render(<LoadingSpinner size="default" />)
      const spinner = screen.getByRole('status')
      
      // Check that the spinner icon has the default size class
      const icon = spinner.querySelector('svg')
      expect(icon).toHaveClass('h-6', 'w-6')
    })

    it('should render large size spinner', () => {
      render(<LoadingSpinner size="lg" />)
      const spinner = screen.getByRole('status')
      
      // Check that the spinner icon has the large size class
      const icon = spinner.querySelector('svg')
      expect(icon).toHaveClass('h-8', 'w-8')
    })

    it('should apply correct text size for small spinner', () => {
      render(<LoadingSpinner size="sm" text="Loading..." />)
      const text = screen.getByText('Loading...', { selector: 'p' })
      expect(text).toHaveClass('text-xs')
    })

    it('should apply correct text size for default spinner', () => {
      render(<LoadingSpinner size="default" text="Loading..." />)
      const text = screen.getByText('Loading...', { selector: 'p' })
      expect(text).toHaveClass('text-sm')
    })

    it('should apply correct text size for large spinner', () => {
      render(<LoadingSpinner size="lg" text="Loading..." />)
      const text = screen.getByText('Loading...', { selector: 'p' })
      expect(text).toHaveClass('text-base')
    })
  })

  describe('Centering', () => {
    it('should not center by default', () => {
      render(<LoadingSpinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).not.toHaveClass('min-h-[200px]')
    })

    it('should center when centered prop is true', () => {
      render(<LoadingSpinner centered />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('min-h-[200px]')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const customClass = 'my-custom-class'
      render(<LoadingSpinner className={customClass} />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass(customClass)
    })

    it('should merge custom className with default classes', () => {
      render(<LoadingSpinner className="custom-class" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('custom-class')
      expect(spinner).toHaveClass('flex')
      expect(spinner).toHaveClass('flex-col')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingSpinner />)
      const spinner = screen.getByRole('status')
      
      expect(spinner).toHaveAttribute('aria-live', 'polite')
      expect(spinner).toHaveAttribute('aria-busy', 'true')
    })

    it('should have screen reader text matching custom text', () => {
      const customText = 'Uploading file...'
      render(<LoadingSpinner text={customText} />)
      
      const srText = screen.getByText(customText, { selector: '.sr-only' })
      expect(srText).toBeInTheDocument()
    })

    it('should hide spinner icon from screen readers', () => {
      render(<LoadingSpinner />)
      const spinner = screen.getByRole('status')
      const icon = spinner.querySelector('svg')
      
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Animation', () => {
    it('should have animate-spin class on the icon', () => {
      render(<LoadingSpinner />)
      const spinner = screen.getByRole('status')
      const icon = spinner.querySelector('svg')
      
      expect(icon).toHaveClass('animate-spin')
    })

    it('should have text-primary class for theme support', () => {
      render(<LoadingSpinner />)
      const spinner = screen.getByRole('status')
      const icon = spinner.querySelector('svg')
      
      expect(icon).toHaveClass('text-primary')
    })
  })

  describe('Text Styling', () => {
    it('should apply muted foreground color to text', () => {
      render(<LoadingSpinner text="Loading..." />)
      const text = screen.getByText('Loading...', { selector: 'p' })
      
      expect(text).toHaveClass('text-muted-foreground')
    })
  })
})
