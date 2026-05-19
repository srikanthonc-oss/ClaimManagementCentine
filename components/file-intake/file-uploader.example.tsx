'use client'

import * as React from 'react'
import { FileUploader } from './file-uploader'
import { ClaimsTable } from '@/components/claims-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { FileUploadResult, Claim } from '@/types'

/**
 * FileUploader Example
 * 
 * Demonstrates the FileUploader component with claims display
 */
export function FileUploaderExample() {
  const [claims, setClaims] = React.useState<Claim[]>([])
  const [uploadResult, setUploadResult] = React.useState<FileUploadResult | null>(null)

  const handleUpload = (result: FileUploadResult) => {
    console.log('Upload result:', result)
    setUploadResult(result)
    
    if (result.success && result.claims.length > 0) {
      setClaims(result.claims)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">File Uploader Example</h1>
        <p className="text-muted-foreground">
          Upload an XLS or XLSX file containing claims data to see the FileUploader component in action
        </p>
      </div>

      {/* File Uploader */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Claims File</CardTitle>
          <CardDescription>
            Drag and drop your file or click to browse. Accepts .xls and .xlsx files up to 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader onUpload={handleUpload} />
        </CardContent>
      </Card>

      {/* Upload Statistics */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">{uploadResult.claimsParsed}</div>
                <div className="text-sm text-muted-foreground">Claims Parsed</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">{uploadResult.errors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {uploadResult.success ? 'Success' : 'Failed'}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claims Table */}
      {claims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Claims ({claims.length})</CardTitle>
            <CardDescription>
              Successfully parsed claims from the uploaded file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClaimsTable claims={claims} />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!uploadResult && (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No file uploaded yet
              </p>
              <p className="text-sm text-muted-foreground">
                Upload a file to see the parsed claims
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Simple FileUploader Example
 * 
 * Minimal example showing basic usage
 */
export function SimpleFileUploaderExample() {
  const handleUpload = (result: FileUploadResult) => {
    if (result.success) {
      alert(`Successfully parsed ${result.claimsParsed} claims!`)
    } else {
      alert(`Upload failed with ${result.errors.length} errors`)
    }
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Simple File Upload</h2>
      <FileUploader onUpload={handleUpload} />
    </div>
  )
}

/**
 * Custom Max Size Example
 * 
 * Example with custom maximum file size
 */
export function CustomMaxSizeExample() {
  const maxSize = 10 * 1024 * 1024 // 10MB

  const handleUpload = (result: FileUploadResult) => {
    console.log('Upload result:', result)
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Custom Max Size (10MB)</h2>
      <FileUploader onUpload={handleUpload} maxSize={maxSize} />
    </div>
  )
}

/**
 * With State Management Example
 * 
 * Example showing integration with state management
 */
export function WithStateManagementExample() {
  const [isUploading, setIsUploading] = React.useState(false)
  const [claims, setClaims] = React.useState<Claim[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const handleUpload = (result: FileUploadResult) => {
    setIsUploading(false)
    setError(null)

    if (result.success) {
      setClaims(result.claims)
    } else {
      setError(`Failed to parse file: ${result.errors[0]?.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">With State Management</h2>
      
      <FileUploader onUpload={handleUpload} />

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {claims.length > 0 && (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">
            Successfully loaded {claims.length} claims
          </p>
        </div>
      )}
    </div>
  )
}
