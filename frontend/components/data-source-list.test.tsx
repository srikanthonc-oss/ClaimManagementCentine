import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataSourceList } from './data-source-list'
import type { DataSource } from '@/types'

// Mock data sources for testing
const mockDataSources: DataSource[] = [
  {
    id: '1',
    name: 'Production Claims API',
    type: 'Claims API',
    config: {
      endpoint: 'https://api.example.com/claims',
      apiKey: 'test-key-123',
      timeout: 5000,
    },
    status: 'active',
    lastSync: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: '2',
    name: 'Legacy EDI Gateway',
    type: 'EDI Gateway',
    config: {
      host: 'edi.example.com',
      port: 22,
      username: 'edi-user',
      password: 'password',
    },
    status: 'inactive',
    lastSync: new Date('2024-01-10T08:00:00Z'),
    createdAt: new Date('2023-12-01T00:00:00Z'),
    updatedAt: new Date('2024-01-10T08:00:00Z'),
  },
  {
    id: '3',
    name: 'FHIR Integration',
    type: 'FHIR API',
    config: {
      baseUrl: 'https://fhir.example.com',
      version: 'R4',
      authToken: 'token-xyz',
    },
    status: 'error',
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z'),
  },
]

describe('DataSourceList', () => {
  describe('Basic Rendering', () => {
    it('should render table with data sources', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      // Check table headers
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Last Sync')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()

      // Check data source names
      expect(screen.getByText('Production Claims API')).toBeInTheDocument()
      expect(screen.getByText('Legacy EDI Gateway')).toBeInTheDocument()
      expect(screen.getByText('FHIR Integration')).toBeInTheDocument()
    })

    it('should render data source types', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(screen.getByText('Claims API')).toBeInTheDocument()
      expect(screen.getByText('EDI Gateway')).toBeInTheDocument()
      expect(screen.getByText('FHIR API')).toBeInTheDocument()
    })

    it('should render single data source', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      const singleDataSource = [mockDataSources[0]]

      render(
        <DataSourceList dataSources={singleDataSource} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(screen.getByText('Production Claims API')).toBeInTheDocument()
      expect(screen.getByText('Claims API')).toBeInTheDocument()
    })
  })

  describe('Status Indicators', () => {
    it('should render active status with green indicator', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[0]]} onEdit={onEdit} onDelete={onDelete} />
      )

      const activeStatus = screen.getByLabelText('Status: Active')
      expect(activeStatus).toBeInTheDocument()
      expect(activeStatus).toHaveClass('text-green-600')
    })

    it('should render inactive status with gray indicator', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[1]]} onEdit={onEdit} onDelete={onDelete} />
      )

      const inactiveStatus = screen.getByLabelText('Status: Inactive')
      expect(inactiveStatus).toBeInTheDocument()
      expect(inactiveStatus).toHaveClass('text-gray-600')
    })

    it('should render error status with red indicator', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[2]]} onEdit={onEdit} onDelete={onDelete} />
      )

      const errorStatus = screen.getByLabelText('Status: Error')
      expect(errorStatus).toBeInTheDocument()
      expect(errorStatus).toHaveClass('text-red-600')
    })

    it('should have accessible status labels', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(screen.getByLabelText('Status: Active')).toBeInTheDocument()
      expect(screen.getByLabelText('Status: Inactive')).toBeInTheDocument()
      expect(screen.getByLabelText('Status: Error')).toBeInTheDocument()
    })
  })

  describe('Last Sync Display', () => {
    it('should display relative time for last sync', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[0]]} onEdit={onEdit} onDelete={onDelete} />
      )

      // Should display relative time (e.g., "X days ago")
      const lastSyncCell = screen.getByText(/ago/)
      expect(lastSyncCell).toBeInTheDocument()
    })

    it('should display "Never" when lastSync is undefined', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[2]]} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(screen.getByText('Never')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render edit and delete buttons for each data source', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      // Should have 3 edit buttons and 3 delete buttons (one for each data source)
      const editButtons = screen.getAllByLabelText(/Edit/)
      const deleteButtons = screen.getAllByLabelText(/Delete/)

      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })

    it('should call onEdit with correct ID when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      const editButton = screen.getByLabelText('Edit Production Claims API')
      await user.click(editButton)

      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(onEdit).toHaveBeenCalledWith('1')
    })

    it('should call onDelete with correct ID when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      const deleteButton = screen.getByLabelText('Delete Production Claims API')
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onDelete).toHaveBeenCalledWith('1')
    })

    it('should handle multiple edit button clicks', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      const editButton1 = screen.getByLabelText('Edit Production Claims API')
      const editButton2 = screen.getByLabelText('Edit Legacy EDI Gateway')

      await user.click(editButton1)
      await user.click(editButton2)

      expect(onEdit).toHaveBeenCalledTimes(2)
      expect(onEdit).toHaveBeenNthCalledWith(1, '1')
      expect(onEdit).toHaveBeenNthCalledWith(2, '2')
    })

    it('should have accessible labels for action buttons', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[0]]} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(screen.getByLabelText('Edit Production Claims API')).toBeInTheDocument()
      expect(screen.getByLabelText('Delete Production Claims API')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no data sources exist', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(<DataSourceList dataSources={[]} onEdit={onEdit} onDelete={onDelete} />)

      expect(screen.getByText('No data sources configured')).toBeInTheDocument()
      expect(
        screen.getByText('Add a data source to start integrating claims data')
      ).toBeInTheDocument()
    })

    it('should not render table when empty', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(<DataSourceList dataSources={[]} onEdit={onEdit} onDelete={onDelete} />)

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('Styling and Theme Support', () => {
    it('should apply custom className', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      const { container } = render(
        <DataSourceList
          dataSources={mockDataSources}
          onEdit={onEdit}
          onDelete={onDelete}
          className="custom-class"
        />
      )

      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })

    it('should have border styling', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      const { container } = render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      const wrapper = container.querySelector('.border')
      expect(wrapper).toBeInTheDocument()
    })

    it('should support dark mode classes for status indicators', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[0]]} onEdit={onEdit} onDelete={onDelete} />
      )

      const activeStatus = screen.getByLabelText('Status: Active')
      expect(activeStatus).toHaveClass('dark:text-green-400')
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={mockDataSources} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('row')).toHaveLength(4) // 1 header + 3 data rows
    })

    it('should have accessible button labels', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[0]]} onEdit={onEdit} onDelete={onDelete} />
      )

      const editButton = screen.getByLabelText('Edit Production Claims API')
      const deleteButton = screen.getByLabelText('Delete Production Claims API')

      expect(editButton).toBeInTheDocument()
      expect(deleteButton).toBeInTheDocument()
    })

    it('should mark icons as decorative with aria-hidden', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList dataSources={[mockDataSources[0]]} onEdit={onEdit} onDelete={onDelete} />
      )

      const ariaHiddenElements = document.querySelectorAll('[aria-hidden="true"]')
      expect(ariaHiddenElements.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle data source with very long name', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      const longNameDataSource: DataSource = {
        ...mockDataSources[0],
        name: 'This is a very long data source name that might wrap to multiple lines in the table',
      }

      render(
        <DataSourceList dataSources={[longNameDataSource]} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(
        screen.getByText(
          'This is a very long data source name that might wrap to multiple lines in the table'
        )
      ).toBeInTheDocument()
    })

    it('should handle all data source types', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      const allTypes: DataSource[] = [
        { ...mockDataSources[0], type: 'Claims API' },
        { ...mockDataSources[0], id: '2', type: 'EDI Gateway' },
        { ...mockDataSources[0], id: '3', type: 'File Upload' },
        { ...mockDataSources[0], id: '4', type: 'FHIR API' },
        { ...mockDataSources[0], id: '5', type: 'SFTP Feed' },
      ]

      render(<DataSourceList dataSources={allTypes} onEdit={onEdit} onDelete={onDelete} />)

      expect(screen.getByText('Claims API')).toBeInTheDocument()
      expect(screen.getByText('EDI Gateway')).toBeInTheDocument()
      expect(screen.getByText('File Upload')).toBeInTheDocument()
      expect(screen.getByText('FHIR API')).toBeInTheDocument()
      expect(screen.getByText('SFTP Feed')).toBeInTheDocument()
    })

    it('should handle data source with recent lastSync', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      const recentDataSource: DataSource = {
        ...mockDataSources[0],
        lastSync: new Date(), // Current time
      }

      render(
        <DataSourceList dataSources={[recentDataSource]} onEdit={onEdit} onDelete={onDelete} />
      )

      // Should show relative time like "a few seconds ago" or similar
      const lastSyncText = screen.getByText(/ago|seconds|minute/)
      expect(lastSyncText).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should work with all props combined', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <DataSourceList
          dataSources={mockDataSources}
          onEdit={onEdit}
          onDelete={onDelete}
          className="custom-class"
        />
      )

      expect(screen.getByText('Production Claims API')).toBeInTheDocument()
      expect(screen.getByText('Legacy EDI Gateway')).toBeInTheDocument()
      expect(screen.getByText('FHIR Integration')).toBeInTheDocument()
      expect(screen.getAllByLabelText(/Edit/)).toHaveLength(3)
      expect(screen.getAllByLabelText(/Delete/)).toHaveLength(3)
    })
  })
})
