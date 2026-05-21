import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricsCard } from './metrics-card'
import { FileText } from 'lucide-react'

describe('MetricsCard', () => {
  describe('Basic Rendering', () => {
    it('should render title and numeric value', () => {
      render(<MetricsCard title="Total Claims" value={1234} />)

      expect(screen.getByText('Total Claims')).toBeInTheDocument()
      expect(screen.getByText('1234')).toBeInTheDocument()
    })

    it('should render title and string value', () => {
      render(<MetricsCard title="Approval Rate" value="85.5%" />)

      expect(screen.getByText('Approval Rate')).toBeInTheDocument()
      expect(screen.getByText('85.5%')).toBeInTheDocument()
    })

    it('should render with formatted currency value', () => {
      render(<MetricsCard title="Total Billed" value="$1,234,567.89" />)

      expect(screen.getByText('Total Billed')).toBeInTheDocument()
      expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
    })

    it('should render with zero value', () => {
      render(<MetricsCard title="Pending Claims" value={0} />)

      expect(screen.getByText('Pending Claims')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Icon Support', () => {
    it('should render with icon', () => {
      render(
        <MetricsCard
          title="Total Claims"
          value={1234}
          icon={<FileText data-testid="file-icon" className="h-4 w-4" />}
        />
      )

      expect(screen.getByTestId('file-icon')).toBeInTheDocument()
    })

    it('should not render icon when not provided', () => {
      render(<MetricsCard title="Total Claims" value={1234} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('Trend Indicator', () => {
    it('should render positive trend with up arrow', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={5.2} />)

      expect(screen.getByText('+5.2%')).toBeInTheDocument()
      // Check for TrendingUp icon by looking for the trend text
      const trendElement = screen.getByText('+5.2%').parentElement
      expect(trendElement).toHaveClass('text-green-600')
    })

    it('should render negative trend with down arrow', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={-3.8} />)

      expect(screen.getByText('-3.8%')).toBeInTheDocument()
      const trendElement = screen.getByText('-3.8%').parentElement
      expect(trendElement).toHaveClass('text-red-600')
    })

    it('should render zero trend as positive', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={0} />)

      expect(screen.getByText('+0.0%')).toBeInTheDocument()
      const trendElement = screen.getByText('+0.0%').parentElement
      expect(trendElement).toHaveClass('text-green-600')
    })

    it('should not render trend when not provided', () => {
      render(<MetricsCard title="Total Claims" value={1234} />)

      expect(screen.queryByText(/[+-]\d+\.\d+%/)).not.toBeInTheDocument()
    })

    it('should format trend to one decimal place', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={5.678} />)

      expect(screen.getByText('+5.7%')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(<MetricsCard title="Total Claims" value={1234} isLoading={true} />)

      // Title should still be visible
      expect(screen.getByText('Total Claims')).toBeInTheDocument()

      // Value should not be visible
      expect(screen.queryByText('1234')).not.toBeInTheDocument()

      // Loading skeleton should be present
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should render loading skeleton with trend placeholder', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={5.2} isLoading={true} />)

      // Should have multiple skeleton elements (value + trend)
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThanOrEqual(2)
    })

    it('should not render loading skeleton when isLoading is false', () => {
      render(<MetricsCard title="Total Claims" value={1234} isLoading={false} />)

      expect(screen.getByText('1234')).toBeInTheDocument()
      expect(document.querySelectorAll('.animate-pulse').length).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label for value', () => {
      render(<MetricsCard title="Total Claims" value={1234} />)

      const valueElement = screen.getByLabelText('Total Claims: 1234')
      expect(valueElement).toBeInTheDocument()
    })

    it('should have accessible label for trend', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={5.2} />)

      const trendElement = screen.getByLabelText('Trend: up 5.2%')
      expect(trendElement).toBeInTheDocument()
    })

    it('should have accessible label for negative trend', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={-3.8} />)

      const trendElement = screen.getByLabelText('Trend: down 3.8%')
      expect(trendElement).toBeInTheDocument()
    })

    it('should mark icon as decorative with aria-hidden', () => {
      render(
        <MetricsCard
          title="Total Claims"
          value={1234}
          icon={<FileText className="h-4 w-4" />}
        />
      )

      const iconContainer = screen.getByText('Total Claims').parentElement?.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Styling and Theme Support', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MetricsCard title="Total Claims" value={1234} className="custom-class" />
      )

      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })

    it('should have hover effect classes', () => {
      const { container } = render(<MetricsCard title="Total Claims" value={1234} />)

      const card = container.querySelector('.hover\\:shadow-md')
      expect(card).toBeInTheDocument()
    })

    it('should have transition classes for smooth animations', () => {
      const { container } = render(<MetricsCard title="Total Claims" value={1234} />)

      const card = container.querySelector('.transition-all')
      expect(card).toBeInTheDocument()
    })

    it('should support dark mode classes for positive trend', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={5.2} />)

      const trendElement = screen.getByText('+5.2%').parentElement
      expect(trendElement).toHaveClass('dark:text-green-400')
    })

    it('should support dark mode classes for negative trend', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={-3.8} />)

      const trendElement = screen.getByText('-3.8%').parentElement
      expect(trendElement).toHaveClass('dark:text-red-400')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      render(<MetricsCard title="Total Claims" value={999999999} />)

      expect(screen.getByText('999999999')).toBeInTheDocument()
    })

    it('should handle very small trend values', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={0.01} />)

      expect(screen.getByText('+0.0%')).toBeInTheDocument()
    })

    it('should handle very large trend values', () => {
      render(<MetricsCard title="Total Claims" value={1234} trend={999.99} />)

      expect(screen.getByText('+1000.0%')).toBeInTheDocument()
    })

    it('should handle empty string value', () => {
      render(<MetricsCard title="Total Claims" value="" />)

      expect(screen.getByText('Total Claims')).toBeInTheDocument()
      // Empty value should still render (as empty div)
      const valueElement = screen.getByLabelText(/Total Claims:/)
      expect(valueElement).toBeInTheDocument()
    })

    it('should handle long title text', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines'
      render(<MetricsCard title={longTitle} value={1234} />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should render multiple MetricsCards together', () => {
      render(
        <div>
          <MetricsCard title="Total Claims" value={1234} />
          <MetricsCard title="Pending Claims" value={567} />
          <MetricsCard title="Approval Rate" value="85.5%" />
        </div>
      )

      expect(screen.getByText('Total Claims')).toBeInTheDocument()
      expect(screen.getByText('Pending Claims')).toBeInTheDocument()
      expect(screen.getByText('Approval Rate')).toBeInTheDocument()
      expect(screen.getByText('1234')).toBeInTheDocument()
      expect(screen.getByText('567')).toBeInTheDocument()
      expect(screen.getByText('85.5%')).toBeInTheDocument()
    })

    it('should work with all props combined', () => {
      render(
        <MetricsCard
          title="Total Claims"
          value={1234}
          icon={<FileText data-testid="icon" className="h-4 w-4" />}
          trend={5.2}
          className="custom-class"
        />
      )

      expect(screen.getByText('Total Claims')).toBeInTheDocument()
      expect(screen.getByText('1234')).toBeInTheDocument()
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('+5.2%')).toBeInTheDocument()
    })
  })
})
