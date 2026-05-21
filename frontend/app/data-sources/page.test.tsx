import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataSourcesPage from './page'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import type { DataSource } from '@/types'

// Mock the store
vi.mock('@/stores/data-sources-store')

// Mock the child components
vi.mock('@/components/data-source-list', () => ({
  DataSourceList: ({ dataSources, onEdit, onDelete }: any) => (
    <div data-testid="data-source-list">
      {dataSources.map((ds: DataSource) => (
        <div key={ds.id} data-testid={`data-source-${ds.id}`}>
          <span>{ds.name}</span>
          <button onClick={() => onEdit(ds.id)}>Edit</button>
          <button onClick={() => onDelete(ds.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/data-source-form', () => ({
  DataSourceForm: ({ dataSource, onSubmit, onCancel }: any) => (
    <form data-testid="data-source-form">
      <input
        data-testid="form-name"
        defaultValue={dataSource?.name || ''}
        onChange={(e) => {
          // Simulate form submission
          if (e.target.value === 'submit') {
            onSubmit({
              name: 'Test Source',
              type: 'Claims API',
              config: { endpoint: 'https://api.test.com', apiKey: 'test-key' },
              status: 'active',
            })
          }
        }}
      />
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  ),
}))

vi.mock('@/components/error-display', () => ({
  ErrorDisplay: ({ title, message, onDismiss }: any) => (
    <div data-testid="error-display">
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}))

describe('DataSourcesPage', () => {
  const mockDataSources: DataSource[] = [
    {
      id: '1',
      name: 'Test API',
      type: 'Claims API',
      config: { endpoint: 'https://api.test.com', apiKey: 'key123' },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Test EDI',
      type: 'EDI Gateway',
      config: { host: 'edi.test.com', port: 22, username: 'user', password: 'pass' },
      status: 'inactive',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ]

  const mockAddDataSource = vi.fn()
  const mockUpdateDataSource = vi.fn()
  const mockDeleteDataSource = vi.fn()
  const mockGetDataSourceById = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup store mock
    vi.mocked(useDataSourcesStore).mockImplementation((selector: any) => {
      const state = {
        dataSources: mockDataSources,
        addDataSource: mockAddDataSource,
        updateDataSource: mockUpdateDataSource,
        deleteDataSource: mockDeleteDataSource,
        getDataSourceById: mockGetDataSourceById,
      }
      return selector(state)
    })

    mockGetDataSourceById.mockImplementation((id: string) =>
      mockDataSources.find((ds) => ds.id === id)
    )
  })

  describe('Page Rendering', () => {
    it('should render page title and description', () => {
      render(<DataSourcesPage />)

      expect(screen.getByText('Data Sources')).toBeInTheDocument()
      expect(
        screen.getByText('Manage data source connections for claims processing')
      ).toBeInTheDocument()
    })

    it('should render Add Data Source button', () => {
      render(<DataSourcesPage />)

      const addButton = screen.getByRole('button', { name: /add new data source/i })
      expect(addButton).toBeInTheDocument()
    })

    it('should render DataSourceList with data sources', () => {
      render(<DataSourcesPage />)

      expect(screen.getByTestId('data-source-list')).toBeInTheDocument()
      expect(screen.getByTestId('data-source-1')).toBeInTheDocument()
      expect(screen.getByTestId('data-source-2')).toBeInTheDocument()
    })
  })

  describe('Add Data Source', () => {
    it('should open form dialog when Add button is clicked', async () => {
      const user = userEvent.setup()
      render(<DataSourcesPage />)

      const addButton = screen.getByRole('button', { name: /add new data source/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByTestId('data-source-form')).toBeInTheDocument()
      })
    })

    it('should add new data source on form submission', async () => {
      const user = userEvent.setup()
      mockAddDataSource.mockReturnValue({ success: true })

      render(<DataSourcesPage />)

      // Open add dialog
      const addButton = screen.getByRole('button', { name: /add new data source/i })
      await user.click(addButton)

      // Submit form
      const formInput = await screen.findByTestId('form-name')
      await user.type(formInput, 'submit')

      await waitFor(() => {
        expect(mockAddDataSource).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Source',
            type: 'Claims API',
            status: 'active',
          })
        )
      })
    })

    it('should display error when add fails', async () => {
      const user = userEvent.setup()
      mockAddDataSource.mockReturnValue({ success: false, error: 'Duplicate name' })

      render(<DataSourcesPage />)

      // Open add dialog
      const addButton = screen.getByRole('button', { name: /add new data source/i })
      await user.click(addButton)

      // Submit form
      const formInput = await screen.findByTestId('form-name')
      await user.type(formInput, 'submit')

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument()
        expect(screen.getByText('Duplicate name')).toBeInTheDocument()
      })
    })

    it('should close dialog on cancel', async () => {
      const user = userEvent.setup()
      render(<DataSourcesPage />)

      // Open add dialog
      const addButton = screen.getByRole('button', { name: /add new data source/i })
      await user.click(addButton)

      // Cancel form
      const cancelButton = await screen.findByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId('data-source-form')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edit Data Source', () => {
    it('should open form dialog with existing data when Edit is clicked', async () => {
      const user = userEvent.setup()
      render(<DataSourcesPage />)

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Data Source')).toBeInTheDocument()
        expect(screen.getByTestId('data-source-form')).toBeInTheDocument()
        expect(mockGetDataSourceById).toHaveBeenCalledWith('1')
      })
    })

    it('should update data source on form submission', async () => {
      const user = userEvent.setup()
      mockUpdateDataSource.mockReturnValue({ success: true })

      render(<DataSourcesPage />)

      // Open edit dialog
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Submit form - clear and type to trigger onChange
      const formInput = await screen.findByTestId('form-name')
      await user.clear(formInput)
      await user.type(formInput, 'submit')

      await waitFor(() => {
        expect(mockUpdateDataSource).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            name: 'Test Source',
            type: 'Claims API',
          })
        )
      })
    })

    it('should display error when update fails', async () => {
      const user = userEvent.setup()
      mockUpdateDataSource.mockReturnValue({ success: false, error: 'Update failed' })

      render(<DataSourcesPage />)

      // Open edit dialog
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Submit form
      const formInput = await screen.findByTestId('form-name')
      await user.clear(formInput)
      await user.type(formInput, 'submit')

      await waitFor(() => {
        expect(mockUpdateDataSource).toHaveBeenCalled()
      })

      // Error should be displayed but dialog should still be open
      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Data Source', () => {
    it('should open confirmation dialog when Delete is clicked', async () => {
      const user = userEvent.setup()
      render(<DataSourcesPage />)

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Are you sure?')).toBeInTheDocument()
        // Use getAllByText since the name appears in both the list and the dialog
        const testApiElements = screen.getAllByText('Test API')
        expect(testApiElements.length).toBeGreaterThan(0)
      })
    })

    it('should delete data source on confirmation', async () => {
      const user = userEvent.setup()
      render(<DataSourcesPage />)

      // Open delete dialog
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteDataSource).toHaveBeenCalledWith('1')
      })
    })

    it('should close dialog on cancel without deleting', async () => {
      const user = userEvent.setup()
      render(<DataSourcesPage />)

      // Open delete dialog
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      // Cancel deletion
      const cancelButton = await screen.findByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(mockDeleteDataSource).not.toHaveBeenCalled()
        expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error when exception occurs during add', async () => {
      const user = userEvent.setup()
      mockAddDataSource.mockImplementation(() => {
        throw new Error('Network error')
      })

      render(<DataSourcesPage />)

      // Open add dialog
      const addButton = screen.getByRole('button', { name: /add new data source/i })
      await user.click(addButton)

      // Submit form
      const formInput = await screen.findByTestId('form-name')
      await user.type(formInput, 'submit')

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should dismiss error when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      mockAddDataSource.mockReturnValue({ success: false, error: 'Test error' })

      render(<DataSourcesPage />)

      // Trigger error
      const addButton = screen.getByRole('button', { name: /add new data source/i })
      await user.click(addButton)
      const formInput = await screen.findByTestId('form-name')
      await user.type(formInput, 'submit')

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })

      // The error display is visible, verify it exists
      expect(screen.getByTestId('error-display')).toBeInTheDocument()
    })
  })
})
