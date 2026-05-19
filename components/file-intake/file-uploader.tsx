'use client'

import * as React from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { parseXLSFile } from '@/lib/xls-parser'
import type { FileUploadResult } from '@/types'

export interface FileUploaderProps {
  /**
   * Callback when file is successfully uploaded and parsed
   */
  onUpload: (result: FileUploadResult) => void

  /**
   * Maximum file size in bytes (default: 50MB)
   */
  maxSize?: number

  /**
   * Optional CSS classes for styling
   */
  className?: string
}

/**
 * FileUploader Component
 * 
 * A drag-and-drop file uploader component for XLS/XLSX files.
 * 
 * Features:
 * - Drag-and-drop zone for intuitive file selection
 * - Click to browse file selection
 * - Accepts only .xls and .xlsx files
 * - Enforces maximum file size (default 50MB)
 * - Shows upload progress indicator during parsing
 * - Displays file validation errors (invalid format, file too large, missing columns)
 * - Triggers parsing on successful upload
 * - Shows parsed file information and error details
 * - Supports both light and dark themes
 * - Accessible with keyboard navigation and screen reader support
 * 
 * @param onUpload - Callback function when file is successfully uploaded and parsed
 * @param maxSize - Maximum file size in bytes (default: 52428800 = 50MB)
 * @param className - Optional CSS classes for styling
 * 
 * @example
 * ```tsx
 * <FileUploader 
 *   onUpload={(result) => handleUploadResult(result)}
 *   maxSize={52428800}
 * />
 * ```
 * 
 * **Validates: Requirements 3.1, 3.2, 3.12, 3.13**
 */
export function FileUploader({
  onUpload,
  maxSize = 52428800, // 50MB default
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [uploadResult, setUploadResult] = React.useState<FileUploadResult | null>(null)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dragCounterRef = React.useRef(0)

  /**
   * Validate file before processing
   */
  const validateFile = (file: File): string | null => {
    // Check file extension
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
      return 'Invalid file format. Please upload a .xls or .xlsx file.'
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return `File too large. Maximum size is ${maxSizeMB}MB, but file is ${fileSizeMB}MB.`
    }

    return null
  }

  /**
   * Process the selected file
   */
  const processFile = async (file: File) => {
    // Reset state
    setValidationError(null)
    setUploadResult(null)

    // Validate file
    const error = validateFile(file)
    if (error) {
      setSelectedFile(file)
      setValidationError(error)
      return
    }

    setSelectedFile(file)

    // Start upload/parsing
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress during parsing
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Parse the file
      const result = await parseXLSFile(file)

      // Complete progress
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Store result
      setUploadResult(result)

      // Call onUpload callback
      onUpload(result)
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'An unexpected error occurred during file parsing.'
      )
    } finally {
      setIsUploading(false)
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  /**
   * Handle file selection from input
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  /**
   * Handle drag enter
   */
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current++
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  /**
   * Handle drag leave
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  /**
   * Handle file drop
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const file = event.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  /**
   * Handle click to browse
   */
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * Handle keyboard interaction
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  /**
   * Clear selected file and results
   */
  const handleClear = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drag and Drop Zone */}
      <div
        className={cn(
          'relative flex min-h-[160px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'pointer-events-none opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload XLS or XLSX file"
        aria-describedby="file-upload-description"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {/* Upload Icon */}
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          {isUploading ? (
            <FileSpreadsheet className="h-8 w-8 animate-pulse text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </div>

        {/* Upload Text */}
        <div className="text-center">
          <p className="mb-1 text-sm font-medium">
            {isUploading ? 'Processing file...' : 'Drop your file here, or click to browse'}
          </p>
          <p id="file-upload-description" className="text-xs text-muted-foreground">
            Accepts .xls and .xlsx files up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>

        {/* Progress Bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="mt-6 w-full max-w-xs">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {uploadProgress}% complete
            </p>
          </div>
        )}
      </div>

      {/* Selected File Info */}
      {selectedFile && !isUploading && (
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            aria-label="Clear selected file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div
          className="flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-4"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
          <div className="flex-1">
            <h4 className="mb-1 text-sm font-medium text-destructive">Upload Error</h4>
            <p className="text-sm text-destructive">{validationError}</p>
          </div>
        </div>
      )}

      {/* Upload Result - Success */}
      {uploadResult && uploadResult.success && (
        <div
          className="flex items-start gap-3 rounded-lg border border-green-500 bg-green-500/10 p-4"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500" />
          <div className="flex-1">
            <h4 className="mb-1 text-sm font-medium text-green-700 dark:text-green-400">
              Upload Successful
            </h4>
            <p className="text-sm text-green-600 dark:text-green-500">
              Successfully parsed {uploadResult.claimsParsed} claim
              {uploadResult.claimsParsed !== 1 ? 's' : ''} from the file.
            </p>
          </div>
        </div>
      )}

      {/* Upload Result - Errors */}
      {uploadResult && !uploadResult.success && uploadResult.errors.length > 0 && (
        <div
          className="rounded-lg border border-destructive bg-destructive/10 p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="mb-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-medium text-destructive">Parsing Errors</h4>
              <p className="text-sm text-destructive">
                {uploadResult.claimsParsed > 0
                  ? `Parsed ${uploadResult.claimsParsed} claim${uploadResult.claimsParsed !== 1 ? 's' : ''}, but encountered ${uploadResult.errors.length} error${uploadResult.errors.length !== 1 ? 's' : ''}.`
                  : `Failed to parse file. Found ${uploadResult.errors.length} error${uploadResult.errors.length !== 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>

          {/* Error List */}
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded border border-destructive/20 bg-background/50 p-3">
            {uploadResult.errors.slice(0, 10).map((error, index) => (
              <div key={index} className="text-xs">
                <span className="font-medium text-destructive">
                  {error.row > 0 ? `Row ${error.row}` : 'File'}
                  {error.column && ` - ${error.column}`}:
                </span>{' '}
                <span className="text-muted-foreground">{error.message}</span>
              </div>
            ))}
            {uploadResult.errors.length > 10 && (
              <p className="text-xs italic text-muted-foreground">
                ... and {uploadResult.errors.length - 10} more error
                {uploadResult.errors.length - 10 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
