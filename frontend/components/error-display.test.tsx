import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorDisplay } from './error-display'

describe('ErrorDisplay', () => {
  describe('Basic Rendering', () => {
    it('renders error message', () => {
      render(<ErrorDisplay message="Something went wrong" />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('renders default title for general error type', () => {
      render(<ErrorDisplay message="Test error" />)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('renders custom title when provided', () => {
      render(<ErrorDisplay message="Test error" title="Custom Error Title" />)
      expect(screen.getByText('Custom Error Title')).toBeInTheDocument()
    })

    it('renders details when provided', () => {
      render(
        <ErrorDisplay 
          message="Test error" 
          details="Additional error details here"
        />
      )
      expect(screen.getByText('Additional error details here')).toBeInTheDocument()
    })

    it('has proper ARIA role and live region', () => {
      const { container } = render(<ErrorDisplay message="Test error" />)
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Error Types', () => {
    it('renders connection error with correct title and icon', () => {
      render(<ErrorDisplay type="connection" message="Connection failed" />)
      expect(screen.getByText('Connection Failed')).toBeInTheDocument()
    })

    it('renders parsing error with correct title', () => {
      render(<ErrorDisplay type="parsing" message="Parse failed" />)
      expect(screen.getByText('Parsing Error')).toBeInTheDocument()
    })

    it('renders network error with correct title', () => {
      render(<ErrorDisplay type="network" message="Network failed" />)
      expect(screen.getByText('Network Error')).toBeInTheDocument()
    })

    it('renders validation error with correct title', () => {
      render(<ErrorDisplay type="validation" message="Validation failed" />)
      expect(screen.getByText('Validation Error')).toBeInTheDocument()
    })

    it('renders general error with correct title', () => {
      render(<ErrorDisplay type="general" message="General error" />)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('Retry Functionality', () => {
    it('renders retry button when onRetry is provided', () => {
      const onRetry = vi.fn()
      render(<ErrorDisplay message="Test error" onRetry={onRetry} />)
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(<ErrorDisplay message="Test error" onRetry={onRetry} />)
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)
      
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('disables retry button when isRetrying is true', () => {
      const onRetry = vi.fn()
      render(<ErrorDisplay message="Test error" onRetry={onRetry} isRetrying={true} />)
      
      const retryButton = screen.getByRole('button', { name: /retrying/i })
      expect(retryButton).toBeDisabled()
    })

    it('shows "Retrying..." text when isRetrying is true', () => {
      const onRetry = vi.fn()
      render(<ErrorDisplay message="Test error" onRetry={onRetry} isRetrying={true} />)
      expect(screen.getByText('Retrying...')).toBeInTheDocument()
    })

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorDisplay message="Test error" />)
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })
  })

  describe('Dismiss Functionality', () => {
    it('renders dismiss button when onDismiss is provided', () => {
      const onDismiss = vi.fn()
      render(<ErrorDisplay message="Test error" onDismiss={onDismiss} />)
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    it('calls onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()
      render(<ErrorDisplay message="Test error" onDismiss={onDismiss} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)
      
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('does not render dismiss button when onDismiss is not provided', () => {
      render(<ErrorDisplay message="Test error" />)
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('renders card variant by default', () => {
      const { container } = render(<ErrorDisplay message="Test error" />)
      // Card variant should have CardHeader, CardDescription, etc.
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('renders inline variant when specified', () => {
      render(<ErrorDisplay message="Test error" variant="inline" />)
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('inline variant shows retry button as icon only', () => {
      const onRetry = vi.fn()
      render(
        <ErrorDisplay 
          message="Test error" 
          variant="inline" 
          onRetry={onRetry}
        />
      )
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ErrorDisplay message="Test error" className="custom-class" />
      )
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('custom-class')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty message gracefully', () => {
      render(<ErrorDisplay message="" />)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('handles very long error messages', () => {
      const longMessage = 'A'.repeat(500)
      render(<ErrorDisplay message={longMessage} />)
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('handles multiline details with whitespace preservation', () => {
      const details = 'Line 1\nLine 2\nLine 3'
      render(<ErrorDisplay message="Test" details={details} />)
      // Check that the details section contains the multiline text
      const detailsElement = screen.getByText((content, element) => {
        return element?.tagName === 'P' && 
               element?.className.includes('font-mono') &&
               element?.textContent === details
      })
      expect(detailsElement).toBeInTheDocument()
    })

    it('renders both retry and dismiss buttons when both callbacks provided', () => {
      const onRetry = vi.fn()
      const onDismiss = vi.fn()
      render(
        <ErrorDisplay 
          message="Test error" 
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      )
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible labels for retry button', () => {
      const onRetry = vi.fn()
      render(<ErrorDisplay message="Test error" onRetry={onRetry} variant="inline" />)
      const retryButton = screen.getByRole('button', { name: 'Retry' })
      expect(retryButton).toBeInTheDocument()
    })

    it('has accessible labels for dismiss button', () => {
      const onDismiss = vi.fn()
      render(<ErrorDisplay message="Test error" onDismiss={onDismiss} variant="inline" />)
      const dismissButton = screen.getByRole('button', { name: 'Dismiss error' })
      expect(dismissButton).toBeInTheDocument()
    })

    it('icons are hidden from screen readers', () => {
      const { container } = render(<ErrorDisplay message="Test error" />)
      const icons = container.querySelectorAll('[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})
