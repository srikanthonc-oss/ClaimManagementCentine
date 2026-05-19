'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Database, RefreshCw, Upload, Activity, Server } from 'lucide-react'
import type { DataSource, DataSourceType } from '@/types'

export interface DataSourceFormProps {
  dataSource?: DataSource
  onSubmit: (data: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  className?: string
}

const typeOptions: { type: DataSourceType; label: string; icon: React.ReactNode }[] = [
  { type: 'Claims API', label: 'Claims API', icon: <Database className="h-4 w-4" /> },
  { type: 'EDI Gateway', label: 'EDI Gateway', icon: <RefreshCw className="h-4 w-4" /> },
  { type: 'File Upload', label: 'File Upload', icon: <Upload className="h-4 w-4" /> },
  { type: 'FHIR API', label: 'FHIR API', icon: <Activity className="h-4 w-4" /> },
  { type: 'SFTP Feed', label: 'SFTP Feed', icon: <Server className="h-4 w-4" /> },
]

export function DataSourceForm({ dataSource, onSubmit, onCancel, className }: DataSourceFormProps) {
  const isEditMode = !!dataSource

  const [type, setType] = React.useState<DataSourceType>(dataSource?.type || 'File Upload')
  const [name, setName] = React.useState(dataSource?.name || '')
  const [endpoint, setEndpoint] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  // Initialize endpoint from existing config
  React.useEffect(() => {
    if (dataSource) {
      const config = dataSource.config as Record<string, unknown>
      setEndpoint(
        (config?.endpoint as string) ||
        (config?.baseUrl as string) ||
        (config?.host as string) ||
        (config?.remotePath as string) ||
        ''
      )
    }
  }, [dataSource])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Source name is required')
      return
    }

    // Build config based on type
    let config: Record<string, unknown> = {}
    switch (type) {
      case 'Claims API':
        config = { endpoint: endpoint || 'https://api.claims.example.com', apiKey: 'demo-key' }
        break
      case 'EDI Gateway':
        config = { host: endpoint || 'edi.example.com', port: 5080, username: 'user', password: 'pass' }
        break
      case 'File Upload':
        config = { allowedExtensions: ['.xls', '.xlsx'], maxFileSize: 52428800 }
        break
      case 'FHIR API':
        config = { baseUrl: endpoint || 'https://fhir.example.com/r4', version: 'R4', authToken: 'demo-token' }
        break
      case 'SFTP Feed':
        config = { host: endpoint || 'sftp.example.com', port: 22, username: 'user', privateKey: 'key', remotePath: '/incoming' }
        break
    }

    onSubmit({
      name: name.trim(),
      type,
      config: config as DataSource['config'],
      status: dataSource?.status || 'active',
      lastSync: dataSource?.lastSync,
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      {/* Type Selector - Card Grid */}
      <div className="grid grid-cols-2 gap-2">
        {typeOptions.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => !isEditMode && setType(option.type)}
            disabled={isEditMode}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all text-left',
              type === option.type
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              isEditMode && type !== option.type && 'opacity-40 cursor-not-allowed'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>

      {/* Source Name */}
      <div className="space-y-1.5">
        <Label htmlFor="source-name" className="text-xs">Source Name</Label>
        <Input
          id="source-name"
          type="text"
          placeholder="e.g. Facet, Amisys, Xcelys"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-xs"
        />
      </div>

      {/* Endpoint / URL - not shown for File Upload */}
      {type !== 'File Upload' && (
        <div className="space-y-1.5">
          <Label htmlFor="endpoint" className="text-xs">Endpoint / URL</Label>
          <Input
            id="endpoint"
            type="text"
            placeholder="https://..."
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 h-9 text-xs">
          {isEditMode ? 'Update Source' : 'Create Source'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9 text-xs">
          Cancel
        </Button>
      </div>
    </form>
  )
}
