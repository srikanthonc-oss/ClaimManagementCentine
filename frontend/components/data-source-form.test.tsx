import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataSourceForm } from './data-source-form'
import type { DataSource } from '@/types'

// Mock data sources for testing
const mockClaimsAPIDataSource: DataSource = {
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
}

const mockEDIGatewayDataSource: DataSource = {
  id: '2',
  name: 'Legacy EDI Gateway',
  type: 'EDI Gateway',
  config: {
    host: 'edi.example.com',
    port: 22,
    username: 'edi-user',
    password: 'password123',
  },
  status: 'inactive',
  createdAt: new Date('2023-12-01T00:00:00Z'),
  updatedAt: new Date('2024-01-10T08:00:00Z'),
}

const mockFileUploadDataSource: DataSource = {
  id: '3',
  name: 'File Upload Source',
  type: 'File Upload',
  config: {
    allowedExtensions: ['.xls', '.xlsx'],
    maxFileSize: 52428800,
  },
  status: 'active',
  createdAt: new Date('2024-01-05T00:00:00Z'),
  updatedAt: new Date('2024-01-05T00:00:00Z'),
}

const mockFHIRAPIDataSource: DataSource = {
  id: '4',
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
}

const mockSFTPFeedDataSource: DataSource = {
  id: '5',
  name: 'SFTP Feed',
  type: 'SFTP Feed',
  config: {
    host: 'sftp.example.com',
    port: 22,
    username: 'sftp-user',
    privateKey: 'private-key-content',
    remotePath: '/data/claims',
  },
  status: 'active',
  createdAt: new Date('2024-01-05T00:00:00Z'),
  updatedAt: new Date('2024-01-05T00:00:00Z'),
}

describe('DataSourceForm', () => {
  describe('Basic Rendering', () => {
    it('should render form with all basic fields', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      expect(screen.getByLabelText(/Data Source Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Data Source Type/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
    })

    it('should render with default Claims API type selected', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      // Claims API fields should be visible
      expect(screen.getByLabelText(/Endpoint/)).toBeInTheDocument()
      expect(screen.getByLabelText(/API Key/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Timeout/)).toBeInTheDocument()
    })

    it('should show Update button in edit mode', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <DataSourceForm
          dataSource={mockClaimsAPIDataSource}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByRole('button', { name: /Update/ })).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      const { container } = render(
        <DataSourceForm onSubmit={onSubmit} onCancel={onCancel} className="custom-class" />
      )

      const form = container.querySelector('form')
      expect(form).toHaveClass('custom-class')
    })
  })

  describe('Data Source Type Selection', () => {
    it('should show Claims API fields when Claims API is selected', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      expect(screen.getByLabelText(/Endpoint/)).toBeInTheDocument()
      expect(screen.getByLabelText(/API Key/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Timeout/)).toBeInTheDocument()
    })

    it('should show EDI Gateway fields when EDI Gateway is selected', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      // Change type to EDI Gateway
      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'EDI Gateway' }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Port/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Username/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
      })
    })

    it('should show File Upload fields when File Upload is selected', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'File Upload' }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Allowed Extensions/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Max File Size/)).toBeInTheDocument()
      })
    })

    it('should show FHIR API fields when FHIR API is selected', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'FHIR API' }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Base URL/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Version/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Auth Token/)).toBeInTheDocument()
      })
    })

    it('should show SFTP Feed fields when SFTP Feed is selected', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'SFTP Feed' }))

      await waitFor(() => {
        expect(screen.getAllByLabelText(/Host/)[0]).toBeInTheDocument()
        expect(screen.getAllByLabelText(/Port/)[0]).toBeInTheDocument()
        expect(screen.getAllByLabelText(/Username/)[0]).toBeInTheDocument()
        expect(screen.getByLabelText(/Private Key/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Remote Path/)).toBeInTheDocument()
      })
    })

    it('should disable type selector in edit mode', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <DataSourceForm
          dataSource={mockClaimsAPIDataSource}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      const typeSelect = screen.getByLabelText(/Data Source Type/)
      expect(typeSelect).toBeDisabled()
    })
  })

  describe('Edit Mode - Pre-filled Values', () => {
    it('should pre-fill Claims API data source values', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <DataSourceForm
          dataSource={mockClaimsAPIDataSource}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByLabelText(/Data Source Name/)).toHaveValue('Production Claims API')
      expect(screen.getByLabelText(/Endpoint/)).toHaveValue('https://api.example.com/claims')
      expect(screen.getByLabelText(/API Key/)).toHaveValue('test-key-123')
      expect(screen.getByLabelText(/Timeout/)).toHaveValue(5000)
    })

    it('should pre-fill EDI Gateway data source values', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <DataSourceForm
          dataSource={mockEDIGatewayDataSource}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByLabelText(/Data Source Name/)).toHaveValue('Legacy EDI Gateway')
      expect(screen.getByLabelText(/Host/)).toHaveValue('edi.example.com')
      expect(screen.getByLabelText(/Port/)).toHaveValue(22)
      expect(screen.getByLabelText(/Username/)).toHaveValue('edi-user')
      expect(screen.getByLabelText(/Password/)).toHaveValue('password123')
    })

    it('should pre-fill File Upload data source values', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <DataSourceForm
          dataSource={mockFileUploadDataSource}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByLabelText(/Data Source Name/)).toHaveValue('File Upload Source')
      expect(screen.getByLabelText(/Allowed Extensions/)).toHaveValue('.xls, .xlsx')
      expect(screen.getByLabelText(/Max File Size/)).toHaveValue(52428800)
    })

    it('should pre-fill FHIR API data source values', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <DataSourceForm
          dataSource={mockFHIRAPIDataSource}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByLabelText(/Data Source Name/)).toHaveValue('FHIR Integration')
      expect(screen.getByLabelText(/Base URL/)).toHaveValue('https://fhir.example.com')
      expect(screen.getByLabelText(/Version/)).toHaveValue('R4')
      expect(screen.getByLabelText(/Auth Token/)).toHaveValue('token-xyz')
    })

    it('should pre-fill SFTP Feed data source values', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <DataSourceForm
          dataSource={mockSFTPFeedDataSource}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByLabelText(/Data Source Name/)).toHaveValue('SFTP Feed')
      expect(screen.getAllByLabelText(/Host/)[0]).toHaveValue('sftp.example.com')
      expect(screen.getAllByLabelText(/Port/)[0]).toHaveValue(22)
      expect(screen.getAllByLabelText(/Username/)[0]).toHaveValue('sftp-user')
      expect(screen.getByLabelText(/Private Key/)).toHaveValue('private-key-content')
      expect(screen.getByLabelText(/Remote Path/)).toHaveValue('/data/claims')
    })
  })

  describe('Form Submission', () => {
    it('should submit valid Claims API data source', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Data Source Name/), 'Test Claims API')
      await user.type(screen.getByLabelText(/Endpoint/), 'https://api.test.com/claims')
      await user.type(screen.getByLabelText(/API Key/), 'test-key')
      await user.type(screen.getByLabelText(/Timeout/), '3000')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Test Claims API',
          type: 'Claims API',
          config: {
            endpoint: 'https://api.test.com/claims',
            apiKey: 'test-key',
            timeout: 3000,
          },
          status: 'active',
          lastSync: undefined,
        })
      })
    })

    it('should submit valid EDI Gateway data source', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Data Source Name/), 'Test EDI')
      
      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'EDI Gateway' }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Host/), 'edi.test.com')
      await user.type(screen.getByLabelText(/Port/), '2222')
      await user.type(screen.getByLabelText(/Username/), 'testuser')
      await user.type(screen.getByLabelText(/Password/), 'testpass')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Test EDI',
          type: 'EDI Gateway',
          config: {
            host: 'edi.test.com',
            port: 2222,
            username: 'testuser',
            password: 'testpass',
          },
          status: 'active',
          lastSync: undefined,
        })
      })
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: /Cancel/ }))

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Endpoint/), 'https://api.test.com')
      await user.type(screen.getByLabelText(/API Key/), 'test-key')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/Data source name is required/)).toBeInTheDocument()
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should show validation errors for invalid Claims API config', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Data Source Name/), 'Test')
      await user.type(screen.getByLabelText(/Endpoint/), 'invalid-url')
      await user.type(screen.getByLabelText(/API Key/), 'key')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should show validation errors for invalid port number', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Data Source Name/), 'Test EDI')
      
      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'EDI Gateway' }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Host/), 'edi.test.com')
      await user.type(screen.getByLabelText(/Port/), '99999')
      await user.type(screen.getByLabelText(/Username/), 'user')
      await user.type(screen.getByLabelText(/Password/), 'pass')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should have required field indicators', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      const requiredIndicators = screen.getAllByText('*')
      expect(requiredIndicators.length).toBeGreaterThan(0)
    })

    it('should have aria-required attributes on required fields', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      expect(screen.getByLabelText(/Data Source Name/)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/Endpoint/)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/API Key/)).toHaveAttribute('aria-required', 'true')
    })

    it('should have aria-live region for errors', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should have descriptive help text for complex fields', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      const typeSelect = screen.getByLabelText(/Data Source Type/)
      expect(typeSelect).toBeInTheDocument()
    })
  })

  describe('Status Selection', () => {
    it('should allow changing status', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      const statusSelect = screen.getByLabelText(/Status/)
      await user.click(statusSelect)
      await user.click(screen.getByRole('option', { name: 'Inactive' }))

      await user.type(screen.getByLabelText(/Data Source Name/), 'Test')
      await user.type(screen.getByLabelText(/Endpoint/), 'https://api.test.com')
      await user.type(screen.getByLabelText(/API Key/), 'key')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'inactive',
          })
        )
      })
    })

    it('should have all status options available', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      const statusSelect = screen.getByLabelText(/Status/)
      await user.click(statusSelect)

      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Error' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle optional timeout field for Claims API', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Data Source Name/), 'Test')
      await user.type(screen.getByLabelText(/Endpoint/), 'https://api.test.com')
      await user.type(screen.getByLabelText(/API Key/), 'key')
      // Don't fill timeout

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            config: expect.not.objectContaining({
              timeout: expect.anything(),
            }),
          })
        )
      })
    })

    it('should handle comma-separated extensions for File Upload', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Data Source Name/), 'Test File Upload')
      
      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'File Upload' }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Allowed Extensions/)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Allowed Extensions/), '.xls, .xlsx, .csv')
      await user.type(screen.getByLabelText(/Max File Size/), '52428800')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            config: {
              allowedExtensions: ['.xls', '.xlsx', '.csv'],
              maxFileSize: 52428800,
            },
          })
        )
      })
    })

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/Data Source Name/), '  Test Name  ')
      await user.type(screen.getByLabelText(/Endpoint/), 'https://api.test.com')
      await user.type(screen.getByLabelText(/API Key/), 'key')

      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Name',
          })
        )
      })
    })

    it('should clear errors when type changes', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DataSourceForm onSubmit={onSubmit} onCancel={onCancel} />)

      // Submit with invalid data to trigger errors
      await user.click(screen.getByRole('button', { name: /Create/ }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Change type
      const typeSelect = screen.getByLabelText(/Data Source Type/)
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'EDI Gateway' }))

      // Errors should be cleared
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })
})
