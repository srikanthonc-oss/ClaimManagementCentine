/**
 * DataSourceList Component Examples
 * 
 * This file demonstrates various usage patterns for the DataSourceList component.
 * These examples can be used as reference when implementing data source management features.
 */

import { DataSourceList } from './data-source-list'
import type { DataSource } from '@/types'

// Sample data sources for examples
const sampleDataSources: DataSource[] = [
  {
    id: '1',
    name: 'Production Claims API',
    type: 'Claims API',
    config: {
      endpoint: 'https://api.example.com/claims',
      apiKey: 'prod-key-123',
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
      password: 'encrypted-password',
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
  {
    id: '4',
    name: 'SFTP Claims Feed',
    type: 'SFTP Feed',
    config: {
      host: 'sftp.example.com',
      port: 22,
      username: 'sftp-user',
      privateKey: 'encrypted-key',
      remotePath: '/claims/incoming',
    },
    status: 'active',
    lastSync: new Date('2024-01-15T12:00:00Z'),
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z'),
  },
  {
    id: '5',
    name: 'Manual File Upload',
    type: 'File Upload',
    config: {
      allowedExtensions: ['.xls', '.xlsx', '.csv'],
      maxFileSize: 52428800, // 50MB
    },
    status: 'active',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
]

/**
 * Example 1: Basic Usage
 * Simple implementation with console logging for actions
 */
export function BasicExample() {
  const handleEdit = (id: string) => {
    console.log('Edit data source:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete data source:', id)
  }

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Data Sources</h2>
      <DataSourceList
        dataSources={sampleDataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

/**
 * Example 2: Empty State
 * Shows the empty state when no data sources are configured
 */
export function EmptyStateExample() {
  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Data Sources</h2>
      <DataSourceList
        dataSources={[]}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  )
}

/**
 * Example 3: Filtered by Status
 * Shows only active data sources
 */
export function FilteredExample() {
  const activeDataSources = sampleDataSources.filter((ds) => ds.status === 'active')

  const handleEdit = (id: string) => {
    console.log('Edit data source:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete data source:', id)
  }

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Active Data Sources</h2>
      <DataSourceList
        dataSources={activeDataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

/**
 * Example 4: With Custom Styling
 * Demonstrates custom className usage
 */
export function CustomStyledExample() {
  const handleEdit = (id: string) => {
    console.log('Edit data source:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete data source:', id)
  }

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Data Sources</h2>
      <DataSourceList
        dataSources={sampleDataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
        className="shadow-lg"
      />
    </div>
  )
}

/**
 * Example 5: Single Data Source
 * Shows the component with just one data source
 */
export function SingleDataSourceExample() {
  const singleDataSource = [sampleDataSources[0]]

  const handleEdit = (id: string) => {
    console.log('Edit data source:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete data source:', id)
  }

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Data Source</h2>
      <DataSourceList
        dataSources={singleDataSource}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

/**
 * Example 6: All Status Types
 * Shows data sources with different status indicators
 */
export function AllStatusTypesExample() {
  const statusExamples: DataSource[] = [
    { ...sampleDataSources[0], name: 'Active Data Source', status: 'active' },
    { ...sampleDataSources[1], id: '2', name: 'Inactive Data Source', status: 'inactive' },
    { ...sampleDataSources[2], id: '3', name: 'Error Data Source', status: 'error' },
  ]

  const handleEdit = (id: string) => {
    console.log('Edit data source:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete data source:', id)
  }

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Status Indicators</h2>
      <DataSourceList
        dataSources={statusExamples}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

/**
 * Example 7: All Data Source Types
 * Shows all supported data source types
 */
export function AllDataSourceTypesExample() {
  const handleEdit = (id: string) => {
    console.log('Edit data source:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete data source:', id)
  }

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">All Data Source Types</h2>
      <DataSourceList
        dataSources={sampleDataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

/**
 * Example 8: With State Management
 * Shows integration with React state for edit/delete operations
 */
export function WithStateManagementExample() {
  const [dataSources, setDataSources] = React.useState(sampleDataSources)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const handleEdit = (id: string) => {
    setEditingId(id)
    // In a real app, this would open an edit dialog/form
    console.log('Editing data source:', id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this data source?')) {
      setDataSources((prev) => prev.filter((ds) => ds.id !== id))
    }
  }

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Data Sources ({dataSources.length})</h2>
      <DataSourceList
        dataSources={dataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {editingId && (
        <div className="mt-4 rounded-md border border-blue-500 bg-blue-50 p-4 dark:bg-blue-950">
          <p className="text-sm">Currently editing data source: {editingId}</p>
          <button
            onClick={() => setEditingId(null)}
            className="mt-2 text-sm text-blue-600 underline dark:text-blue-400"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// Note: Import React for the state management example
import * as React from 'react'
