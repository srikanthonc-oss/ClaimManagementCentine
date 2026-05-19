import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClassificationGroup } from './classification-group'
import type { Claim } from '@/types'

// Mock the ClaimsTable component to simplify testing
vi.mock('@/components/claims-table', () => ({
  ClaimsTable: ({ claims }: { claims: Claim[] }) => (
    <div data-testid="claims-table">
      <div data-testid="claims-count">{claims.length}</div>
      {claims.map((claim) => (
        <div key={claim.id} data-testid={`claim-${claim.id}`}>
          {claim.claimNumber}
        </div>
      ))}
    </div>
  ),
}))

// Helper function to create mock claims
const createMockClaim = (overrides: Partial<Claim> = {}): Claim => ({
  id: `claim-${Math.random()}`,
  claimNumber: 'CLM-001',
  classification: 'DUAL',
  platform: 'Facet',
  providerName: 'Test Provider',
  billedAmount: 1000,
  status: 'Pending',
  confidence: 85,
  daysAged: 10,
  state: 'CA',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('ClassificationGroup', () => {
  describe('Header Display', () => {
    it('should display classification name in header', () => {
      const claims = [createMockClaim()]
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByText('DUAL')).toBeInTheDocument()
    })

    it('should display claim count with singular form for 1 claim', () => {
      const claims = [createMockClaim()]
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByText('1 claim')).toBeInTheDocument()
    })

    it('should display claim count with plural form for multiple claims', () => {
      const claims = [
        createMockClaim({ id: '1' }),
        createMockClaim({ id: '2' }),
        createMockClaim({ id: '3' }),
      ]
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByText('3 claims')).toBeInTheDocument()
    })

    it('should display 0 claims when no claims provided', () => {
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={[]}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByText('0 claims')).toBeInTheDocument()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should not show claims table when collapsed', () => {
      const claims = [createMockClaim()]
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      expect(screen.queryByTestId('claims-table')).not.toBeInTheDocument()
    })

    it('should show claims table when expanded', () => {
      const claims = [createMockClaim()]
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByTestId('claims-table')).toBeInTheDocument()
    })

    it('should call onToggle when header is clicked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      const claims = [createMockClaim()]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={onToggle}
        />
      )

      const trigger = screen.getByRole('button')
      await user.click(trigger)

      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('should call onToggle when expanded header is clicked to collapse', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      const claims = [createMockClaim()]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={onToggle}
        />
      )

      const trigger = screen.getByRole('button')
      await user.click(trigger)

      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Platform Filtering', () => {
    it('should display all claims when no platform filter is selected', () => {
      const claims = [
        createMockClaim({ id: '1', platform: 'Facet' }),
        createMockClaim({ id: '2', platform: 'Amisys' }),
        createMockClaim({ id: '3', platform: 'Xcelys' }),
      ]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
        />
      )

      const claimsTable = screen.getByTestId('claims-table')
      expect(within(claimsTable).getByTestId('claims-count')).toHaveTextContent('3')
    })

    it('should filter claims by single selected platform', () => {
      const claims = [
        createMockClaim({ id: '1', platform: 'Facet' }),
        createMockClaim({ id: '2', platform: 'Amisys' }),
        createMockClaim({ id: '3', platform: 'Xcelys' }),
      ]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
          selectedPlatforms={['Facet']}
        />
      )

      const claimsTable = screen.getByTestId('claims-table')
      expect(within(claimsTable).getByTestId('claims-count')).toHaveTextContent('1')
      expect(within(claimsTable).getByTestId('claim-1')).toBeInTheDocument()
    })

    it('should filter claims by multiple selected platforms', () => {
      const claims = [
        createMockClaim({ id: '1', platform: 'Facet' }),
        createMockClaim({ id: '2', platform: 'Amisys' }),
        createMockClaim({ id: '3', platform: 'Xcelys' }),
      ]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
          selectedPlatforms={['Facet', 'Amisys']}
        />
      )

      const claimsTable = screen.getByTestId('claims-table')
      expect(within(claimsTable).getByTestId('claims-count')).toHaveTextContent('2')
      expect(within(claimsTable).getByTestId('claim-1')).toBeInTheDocument()
      expect(within(claimsTable).getByTestId('claim-2')).toBeInTheDocument()
    })

    it('should update claim count in header based on platform filter', () => {
      const claims = [
        createMockClaim({ id: '1', platform: 'Facet' }),
        createMockClaim({ id: '2', platform: 'Amisys' }),
        createMockClaim({ id: '3', platform: 'Xcelys' }),
      ]

      const { rerender } = render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByText('3 claims')).toBeInTheDocument()

      rerender(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
          selectedPlatforms={['Facet']}
        />
      )

      expect(screen.getByText('1 claim')).toBeInTheDocument()
    })

    it('should show empty state when platform filter excludes all claims', () => {
      const claims = [
        createMockClaim({ id: '1', platform: 'Facet' }),
        createMockClaim({ id: '2', platform: 'Facet' }),
      ]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
          selectedPlatforms={['Amisys']}
        />
      )

      expect(screen.getByText('No claims match the selected platform filters')).toBeInTheDocument()
      expect(screen.queryByTestId('claims-table')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty claims array', () => {
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={[]}
          expanded={true}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByText('No claims match the selected platform filters')).toBeInTheDocument()
    })

    it('should handle classification with special characters', () => {
      const claims = [createMockClaim()]
      render(
        <ClassificationGroup
          classification="Corrected Claims"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByText('Corrected Claims')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const claims = [createMockClaim()]
      const { container } = render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
          className="custom-class"
        />
      )

      const accordion = container.querySelector('.custom-class')
      expect(accordion).toBeInTheDocument()
    })

    it('should handle empty selectedPlatforms array same as undefined', () => {
      const claims = [
        createMockClaim({ id: '1', platform: 'Facet' }),
        createMockClaim({ id: '2', platform: 'Amisys' }),
      ]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
          selectedPlatforms={[]}
        />
      )

      const claimsTable = screen.getByTestId('claims-table')
      expect(within(claimsTable).getByTestId('claims-count')).toHaveTextContent('2')
    })
  })

  describe('Integration with ClaimsTable', () => {
    it('should pass filtered claims to ClaimsTable component', () => {
      const claims = [
        createMockClaim({ id: '1', claimNumber: 'CLM-001', platform: 'Facet' }),
        createMockClaim({ id: '2', claimNumber: 'CLM-002', platform: 'Amisys' }),
      ]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
          selectedPlatforms={['Facet']}
        />
      )

      expect(screen.getByTestId('claim-1')).toBeInTheDocument()
      expect(screen.queryByTestId('claim-2')).not.toBeInTheDocument()
    })

    it('should pass all claims to ClaimsTable when no filter applied', () => {
      const claims = [
        createMockClaim({ id: '1', claimNumber: 'CLM-001' }),
        createMockClaim({ id: '2', claimNumber: 'CLM-002' }),
      ]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={true}
          onToggle={vi.fn()}
        />
      )

      expect(screen.getByTestId('claim-1')).toBeInTheDocument()
      expect(screen.getByTestId('claim-2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button for accordion trigger', () => {
      const claims = [createMockClaim()]
      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={vi.fn()}
        />
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      const claims = [createMockClaim()]

      render(
        <ClassificationGroup
          classification="DUAL"
          claims={claims}
          expanded={false}
          onToggle={onToggle}
        />
      )

      const trigger = screen.getByRole('button')
      trigger.focus()
      await user.keyboard('{Enter}')

      expect(onToggle).toHaveBeenCalled()
    })
  })
})
