import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploader } from './file-uploader'
import * as xlsParser from '@/lib/xls-parser'
import type { FileUploadResult } from '@/types'

// Mock the xls-parser module
vi.mock('@/lib/xls-parser', () => ({
  parseXLSFile: vi.fn(),
}))

describe('FileUploader', () => {
  const mockOnUpload = vi.fn()
  const mockParseXLSFile = vi.mocked(xlsParser.parseXLSFile)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render the upload zone with correct text', () => {
      render(<FileUploader onUpload={mockOnUpload} />)

      expect(screen.getByText(/Drop your file here, or click to browse/i)).toBeInTheDocument()
      expect(screen.getByText(/Accepts .xls and .xlsx files up to 50MB/i)).toBeInTheDocument()
    })

    it('should render with custom max size', () => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      render(<FileUploader onUpload={mockOnUpload} maxSize={maxSize} />)

      expect(screen.getByText(/Accepts .xls and .xlsx files up to 10MB/i)).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<FileUploader onUpload={mockOnUpload} />)

      const dropZone = screen.getByRole('button', { name: /Upload XLS or XLSX file/i })
      expect(dropZone).toHaveAttribute('tabIndex', '0')
      expect(dropZone).toHaveAttribute('aria-describedby', 'file-upload-description')
    })
  })

  describe('File Selection via Click', () => {
    it('should open file dialog when clicking the drop zone', async () => {
      const user = userEvent.setup()
      render(<FileUploader onUpload={mockOnUpload} />)

      const dropZone = screen.getByRole('button', { name: /Upload XLS or XLSX file/i })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      // Mock the click method
      const clickSpy = vi.spyOn(fileInput, 'click')

      await user.click(dropZone)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should trigger file input on Enter key press', async () => {
      const user = userEvent.setup()
      render(<FileUploader onUpload={mockOnUpload} />)

      const dropZone = screen.getByRole('button', { name: /Upload XLS or XLSX file/i })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')

      dropZone.focus()
      await user.keyboard('{Enter}')

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should trigger file input on Space key press', async () => {
      const user = userEvent.setup()
      render(<FileUploader onUpload={mockOnUpload} />)

      const dropZone = screen.getByRole('button', { name: /Upload XLS or XLSX file/i })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')

      dropZone.focus()
      await user.keyboard(' ')

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('File Validation', () => {
    it('should reject files with invalid extensions', async () => {
      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      // Manually trigger the change event with the file
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      const changeEvent = new Event('change', { bubbles: true })
      fileInput.dispatchEvent(changeEvent)

      await waitFor(
        () => {
          expect(screen.getByText(/Invalid file format/i)).toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      expect(mockParseXLSFile).not.toHaveBeenCalled()
      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('should accept .xls files', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: true,
        claimsParsed: 5,
        errors: [],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xls', {
        type: 'application/vnd.ms-excel',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(mockParseXLSFile).toHaveBeenCalledWith(file)
      })
    })

    it('should accept .xlsx files', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: true,
        claimsParsed: 5,
        errors: [],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(mockParseXLSFile).toHaveBeenCalledWith(file)
      })
    })

    it('should reject files exceeding max size', async () => {
      const user = userEvent.setup()
      const maxSize = 1024 // 1KB
      render(<FileUploader onUpload={mockOnUpload} maxSize={maxSize} />)

      // Create a file larger than maxSize
      const largeContent = 'x'.repeat(2048)
      const file = new File([largeContent], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/File too large/i)).toBeInTheDocument()
      })

      expect(mockParseXLSFile).not.toHaveBeenCalled()
      expect(mockOnUpload).not.toHaveBeenCalled()
    })
  })

  describe('File Upload and Parsing', () => {
    it('should show progress indicator during upload', async () => {
      const user = userEvent.setup()
      mockParseXLSFile.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  claimsParsed: 5,
                  errors: [],
                  claims: [],
                }),
              200
            )
          })
      )

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      // Wait for processing text to appear
      await waitFor(
        () => {
          expect(screen.getByText(/Processing file.../i)).toBeInTheDocument()
        },
        { timeout: 1000 }
      )

      // Wait for processing to complete
      await waitFor(
        () => {
          expect(screen.queryByText(/Processing file.../i)).not.toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })

    it('should display success message on successful upload', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: true,
        claimsParsed: 10,
        errors: [],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/Upload Successful/i)).toBeInTheDocument()
        expect(screen.getByText(/Successfully parsed 10 claims/i)).toBeInTheDocument()
      })

      expect(mockOnUpload).toHaveBeenCalledWith(mockResult)
    })

    it('should display singular claim text for single claim', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: true,
        claimsParsed: 1,
        errors: [],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/Successfully parsed 1 claim from/i)).toBeInTheDocument()
      })
    })

    it('should display parsing errors when upload fails', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: false,
        claimsParsed: 0,
        errors: [
          { row: 0, message: 'Missing required columns: ClaimNumber, Platform', severity: 'error' },
        ],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/Parsing Errors/i)).toBeInTheDocument()
        expect(
          screen.getByText(/Missing required columns: ClaimNumber, Platform/i)
        ).toBeInTheDocument()
      })

      expect(mockOnUpload).toHaveBeenCalledWith(mockResult)
    })

    it('should display multiple parsing errors', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: false,
        claimsParsed: 2,
        errors: [
          { row: 2, column: 'BilledAmount', message: 'Invalid amount', severity: 'error' },
          { row: 3, column: 'Platform', message: 'Invalid platform', severity: 'error' },
          { row: 4, column: 'Status', message: 'Invalid status', severity: 'error' },
        ],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/Row 2 - BilledAmount:/i)).toBeInTheDocument()
        expect(screen.getByText(/Row 3 - Platform:/i)).toBeInTheDocument()
        expect(screen.getByText(/Row 4 - Status:/i)).toBeInTheDocument()
      })
    })

    it('should limit error display to 10 errors', async () => {
      const user = userEvent.setup()
      const errors = Array.from({ length: 15 }, (_, i) => ({
        row: i + 1,
        message: `Error ${i + 1}`,
        severity: 'error' as const,
      }))
      const mockResult: FileUploadResult = {
        success: false,
        claimsParsed: 0,
        errors,
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/... and 5 more errors/i)).toBeInTheDocument()
      })
    })

    it('should handle parsing exceptions', async () => {
      const user = userEvent.setup()
      mockParseXLSFile.mockRejectedValue(new Error('Unexpected parsing error'))

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/Upload Error/i)).toBeInTheDocument()
        expect(screen.getByText(/Unexpected parsing error/i)).toBeInTheDocument()
      })
    })
  })

  describe('File Information Display', () => {
    it('should display selected file information', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: true,
        claimsParsed: 5,
        errors: [],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['x'.repeat(1024 * 100)], 'claims-data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText('claims-data.xlsx')).toBeInTheDocument()
        expect(screen.getByText(/0.10 MB/i)).toBeInTheDocument()
      })
    })

    it('should allow clearing selected file', async () => {
      const user = userEvent.setup()
      const mockResult: FileUploadResult = {
        success: true,
        claimsParsed: 5,
        errors: [],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      })

      const clearButton = screen.getByRole('button', { name: /Clear selected file/i })
      await user.click(clearButton)

      expect(screen.queryByText('test.xlsx')).not.toBeInTheDocument()
      expect(screen.queryByText(/Upload Successful/i)).not.toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    it('should process dropped file', async () => {
      const mockResult: FileUploadResult = {
        success: true,
        claimsParsed: 5,
        errors: [],
        claims: [],
      }
      mockParseXLSFile.mockResolvedValue(mockResult)

      render(<FileUploader onUpload={mockOnUpload} />)

      const dropZone = screen.getByRole('button', { name: /Upload XLS or XLSX file/i })

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      // Create a proper drop event
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      })

      dropZone.dispatchEvent(dropEvent)

      await waitFor(() => {
        expect(mockParseXLSFile).toHaveBeenCalledWith(file)
      })
    })
  })
})
