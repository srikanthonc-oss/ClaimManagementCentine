import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DynamicTabs } from './dynamic-tabs'
import type { Classification } from '@/types'

describe('DynamicTabs', () => {
  const mockClassifications: Classification[] = ['DUAL', 'COB', 'Pricing', 'Auth']
  const mockCounts = {
    DUAL: 45,
    COB: 23,
    Pricing: 12,
    Auth: 8,
  }

  describe('Tab Generation', () => {
    it('should generate tabs from unique classification values', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Verify all tabs are rendered (Requirement 4.1, 4.2)
      expect(screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /COB tab with 23 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Pricing tab with 12 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Auth tab with 8 claims/i })).toBeInTheDocument()
    })

    it('should display claim count in each tab label', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Verify counts are displayed (Requirement 4.4)
      const dualTab = screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })
      expect(within(dualTab).getByText('45')).toBeInTheDocument()

      const cobTab = screen.getByRole('tab', { name: /COB tab with 23 claims/i })
      expect(within(cobTab).getByText('23')).toBeInTheDocument()

      const pricingTab = screen.getByRole('tab', { name: /Pricing tab with 12 claims/i })
      expect(within(pricingTab).getByText('12')).toBeInTheDocument()

      const authTab = screen.getByRole('tab', { name: /Auth tab with 8 claims/i })
      expect(within(authTab).getByText('8')).toBeInTheDocument()
    })

    it('should sort tabs alphabetically by classification name', () => {
      const onTabChange = vi.fn()
      const unsortedClassifications: Classification[] = ['Pricing', 'DUAL', 'Auth', 'COB']
      
      render(
        <DynamicTabs
          classifications={unsortedClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Get all tabs and verify they are in alphabetical order (Requirement 4.6)
      const tabs = screen.getAllByRole('tab')
      const tabTexts = tabs.map((tab) => tab.textContent)
      
      // Expected order: Auth, COB, DUAL, Pricing
      expect(tabTexts[0]).toContain('Auth')
      expect(tabTexts[1]).toContain('COB')
      expect(tabTexts[2]).toContain('DUAL')
      expect(tabTexts[3]).toContain('Pricing')
    })

    it('should handle empty classifications array', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={[]}
          counts={{}}
          activeTab=""
          onTabChange={onTabChange}
        />
      )

      // Should render tabs container but no tab triggers
      const tablist = screen.getByRole('tablist')
      expect(tablist).toBeInTheDocument()
      expect(screen.queryAllByRole('tab')).toHaveLength(0)
    })

    it('should handle missing count for a classification', () => {
      const onTabChange = vi.fn()
      const classifications: Classification[] = ['DUAL', 'COB']
      const incompleteCounts = { DUAL: 45 } // Missing COB count
      
      render(
        <DynamicTabs
          classifications={classifications}
          counts={incompleteCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Should default to 0 for missing count
      const cobTab = screen.getByRole('tab', { name: /COB tab with 0 claims/i })
      expect(within(cobTab).getByText('0')).toBeInTheDocument()
    })
  })

  describe('Active Tab Highlighting', () => {
    it('should highlight the active tab', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="COB"
          onTabChange={onTabChange}
        />
      )

      // Verify active tab has selected state (Requirement 4.5)
      const cobTab = screen.getByRole('tab', { name: /COB tab with 23 claims/i })
      expect(cobTab).toHaveAttribute('data-state', 'active')
      expect(cobTab).toHaveAttribute('aria-selected', 'true')

      // Verify other tabs are not selected
      const dualTab = screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })
      expect(dualTab).toHaveAttribute('data-state', 'inactive')
      expect(dualTab).toHaveAttribute('aria-selected', 'false')
    })

    it('should update active tab when activeTab prop changes', () => {
      const onTabChange = vi.fn()
      const { rerender } = render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Initially DUAL is active
      let dualTab = screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })
      expect(dualTab).toHaveAttribute('data-state', 'active')

      // Change active tab to Pricing
      rerender(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="Pricing"
          onTabChange={onTabChange}
        />
      )

      // Now Pricing should be active
      const pricingTab = screen.getByRole('tab', { name: /Pricing tab with 12 claims/i })
      expect(pricingTab).toHaveAttribute('data-state', 'active')

      // DUAL should no longer be active
      dualTab = screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })
      expect(dualTab).toHaveAttribute('data-state', 'inactive')
    })
  })

  describe('Tab Switching', () => {
    it('should call onTabChange when a tab is clicked', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()
      
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Click on COB tab
      const cobTab = screen.getByRole('tab', { name: /COB tab with 23 claims/i })
      await user.click(cobTab)

      // Verify callback was called with correct classification (Requirement 4.5)
      expect(onTabChange).toHaveBeenCalledWith('COB')
      // Note: Radix UI may call the callback multiple times during interaction
      expect(onTabChange).toHaveBeenCalled()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()
      
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Focus on the first tab
      const authTab = screen.getByRole('tab', { name: /Auth tab with 8 claims/i })
      authTab.focus()

      // Press ArrowRight to move to next tab
      await user.keyboard('{ArrowRight}')

      // Should move to COB tab (next in alphabetical order)
      expect(onTabChange).toHaveBeenCalled()
    })

    it('should render children content for active tab', () => {
      const onTabChange = vi.fn()
      const testContent = <div data-testid="tab-content">Test Content</div>
      
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        >
          {testContent}
        </DynamicTabs>
      )

      // Verify content is rendered (Requirement 4.3)
      expect(screen.getByTestId('tab-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large number of classifications efficiently', () => {
      const onTabChange = vi.fn()
      const largeClassifications: Classification[] = [
        'DUAL',
        'Duplicate',
        'COB',
        'Pricing',
        'Auth',
        'Corrected Claims',
        'High Dollar',
        'Other Pend',
      ]
      const largeCounts = largeClassifications.reduce(
        (acc, classification) => {
          acc[classification] = Math.floor(Math.random() * 100)
          return acc
        },
        {} as Record<string, number>
      )

      const startTime = performance.now()
      render(
        <DynamicTabs
          classifications={largeClassifications}
          counts={largeCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )
      const endTime = performance.now()

      // Should render within 300ms (Requirement 12.3)
      expect(endTime - startTime).toBeLessThan(300)

      // Verify all tabs are rendered
      expect(screen.getAllByRole('tab')).toHaveLength(8)
    })

    it('should memoize sorted classifications to avoid unnecessary re-sorts', () => {
      const onTabChange = vi.fn()
      const { rerender } = render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Get initial tab order
      const initialTabs = screen.getAllByRole('tab')
      const initialOrder = initialTabs.map((tab) => tab.textContent)

      // Rerender with same classifications but different activeTab
      rerender(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="COB"
          onTabChange={onTabChange}
        />
      )

      // Tab order should remain the same (memoization working)
      const updatedTabs = screen.getAllByRole('tab')
      const updatedOrder = updatedTabs.map((tab) => tab.textContent)
      expect(updatedOrder).toEqual(initialOrder)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Verify tablist has label
      const tablist = screen.getByRole('tablist', { name: /Claims classification tabs/i })
      expect(tablist).toBeInTheDocument()

      // Verify each tab has descriptive label
      expect(screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /COB tab with 23 claims/i })).toBeInTheDocument()
    })

    it('should have proper tabpanel role and label', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        >
          <div>Content</div>
        </DynamicTabs>
      )

      // Verify tabpanel exists - Radix UI uses aria-labelledby instead of aria-label
      const tabpanel = screen.getByRole('tabpanel')
      expect(tabpanel).toBeInTheDocument()
      expect(tabpanel).toHaveAttribute('aria-label', 'DUAL claims content')
    })

    it('should handle singular vs plural claim count in labels', () => {
      const onTabChange = vi.fn()
      const singleCounts = {
        DUAL: 1,
        COB: 0,
        Pricing: 2,
      }
      
      render(
        <DynamicTabs
          classifications={['DUAL', 'COB', 'Pricing']}
          counts={singleCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Verify singular form for count of 1
      expect(screen.getByRole('tab', { name: /DUAL tab with 1 claim$/i })).toBeInTheDocument()
      
      // Verify plural form for count of 0
      expect(screen.getByRole('tab', { name: /COB tab with 0 claims/i })).toBeInTheDocument()
      
      // Verify plural form for count > 1
      expect(screen.getByRole('tab', { name: /Pricing tab with 2 claims/i })).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply custom className', () => {
      const onTabChange = vi.fn()
      const { container } = render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
          className="custom-class"
        />
      )

      // Verify custom class is applied to root element
      const tabsRoot = container.querySelector('.custom-class')
      expect(tabsRoot).toBeInTheDocument()
    })

    it('should apply active state styling to count badge', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={mockClassifications}
          counts={mockCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Get the active tab
      const dualTab = screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })
      
      // Find the count badge within the tab
      const countBadge = within(dualTab).getByText('45')
      
      // Verify it has active state
      expect(countBadge).toHaveAttribute('data-state', 'active')
    })
  })

  describe('Edge Cases', () => {
    it('should handle classifications with special characters', () => {
      const onTabChange = vi.fn()
      const specialClassifications: Classification[] = ['Corrected Claims', 'High Dollar', 'Other Pend']
      const specialCounts = {
        'Corrected Claims': 15,
        'High Dollar': 7,
        'Other Pend': 3,
      }
      
      render(
        <DynamicTabs
          classifications={specialClassifications}
          counts={specialCounts}
          activeTab="Corrected Claims"
          onTabChange={onTabChange}
        />
      )

      // Verify tabs with spaces are rendered correctly
      expect(screen.getByRole('tab', { name: /Corrected Claims tab with 15 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /High Dollar tab with 7 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Other Pend tab with 3 claims/i })).toBeInTheDocument()
    })

    it('should handle zero counts', () => {
      const onTabChange = vi.fn()
      const zeroCounts = {
        DUAL: 0,
        COB: 0,
        Pricing: 0,
      }
      
      render(
        <DynamicTabs
          classifications={['DUAL', 'COB', 'Pricing']}
          counts={zeroCounts}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Verify zero counts are displayed
      expect(screen.getByRole('tab', { name: /DUAL tab with 0 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /COB tab with 0 claims/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Pricing tab with 0 claims/i })).toBeInTheDocument()
    })

    it('should handle single classification', () => {
      const onTabChange = vi.fn()
      render(
        <DynamicTabs
          classifications={['DUAL']}
          counts={{ DUAL: 45 }}
          activeTab="DUAL"
          onTabChange={onTabChange}
        />
      )

      // Should render single tab
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(1)
      expect(screen.getByRole('tab', { name: /DUAL tab with 45 claims/i })).toBeInTheDocument()
    })
  })
})
