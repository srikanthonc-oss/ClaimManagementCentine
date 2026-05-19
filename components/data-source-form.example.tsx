'use client'

import * as React from 'react'
import { DataSourceForm } from './data-source-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { DataSource } from '@/types'

/**
 * Example: DataSourceForm in Create Mode
 * 
 * Demonstrates using the DataSourceForm component to create a new data source.
 */
export function CreateDataSourceExample() {
  const [open, setOpen] = React.useState(false)

  const handleSubmit = (data: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Creating new data source:', data)
    
    // In a real application, you would:
    // 1. Generate an ID
    // 2. Add timestamps
    // 3. Save to backend/state management
    const newDataSource: DataSource = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    console.log('New data source created:', newDataSource)
    setOpen(false)
  }

  const handleCancel = () => {
    console.log('Create cancelled')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Data Source</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Data Source</DialogTitle>
        </DialogHeader>
        <DataSourceForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Example: DataSourceForm in Edit Mode
 * 
 * Demonstrates using the DataSourceForm component to edit an existing data source.
 */
export function EditDataSourceExample() {
  const [open, setOpen] = React.useState(false)

  // Example existing data source
  const existingDataSource: DataSource = {
    id: '1',
    name: 'Production Claims API',
    type: 'Claims API',
    config: {
      endpoint: 'https://api.example.com/claims',
      apiKey: 'existing-key-123',
      timeout: 5000,
    },
    status: 'active',
    lastSync: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  }

  const handleSubmit = (data: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Updating data source:', data)
    
    // In a real application, you would:
    // 1. Keep the existing ID and createdAt
    // 2. Update the updatedAt timestamp
    // 3. Save to backend/state management
    const updatedDataSource: DataSource = {
      ...data,
      id: existingDataSource.id,
      createdAt: existingDataSource.createdAt,
      updatedAt: new Date(),
    }
    
    console.log('Data source updated:', updatedDataSource)
    setOpen(false)
  }

  const handleCancel = () => {
    console.log('Edit cancelled')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Data Source</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Source</DialogTitle>
        </DialogHeader>
        <DataSourceForm
          dataSource={existingDataSource}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Example: All Data Source Types
 * 
 * Demonstrates creating data sources of all supported types.
 */
export function AllDataSourceTypesExample() {
  const [open, setOpen] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<string>('')

  const exampleDataSources: Record<string, DataSource> = {
    'Claims API': {
      id: '1',
      name: 'Example Claims API',
      type: 'Claims API',
      config: {
        endpoint: 'https://api.example.com/claims',
        apiKey: 'example-key',
        timeout: 3000,
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'EDI Gateway': {
      id: '2',
      name: 'Example EDI Gateway',
      type: 'EDI Gateway',
      config: {
        host: 'edi.example.com',
        port: 22,
        username: 'edi-user',
        password: 'edi-password',
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'File Upload': {
      id: '3',
      name: 'Example File Upload',
      type: 'File Upload',
      config: {
        allowedExtensions: ['.xls', '.xlsx', '.csv'],
        maxFileSize: 52428800, // 50MB
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'FHIR API': {
      id: '4',
      name: 'Example FHIR API',
      type: 'FHIR API',
      config: {
        baseUrl: 'https://fhir.example.com',
        version: 'R4',
        authToken: 'fhir-token',
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'SFTP Feed': {
      id: '5',
      name: 'Example SFTP Feed',
      type: 'SFTP Feed',
      config: {
        host: 'sftp.example.com',
        port: 22,
        username: 'sftp-user',
        privateKey: 'private-key-content',
        remotePath: '/data/claims',
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }

  const handleSubmit = (data: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Data source submitted:', data)
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Try Different Data Source Types</h2>
      <div className="flex flex-wrap gap-2">
        {Object.keys(exampleDataSources).map((type) => (
          <Button
            key={type}
            variant="outline"
            onClick={() => {
              setSelectedType(type)
              setOpen(true)
            }}
          >
            {type}
          </Button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {selectedType}</DialogTitle>
          </DialogHeader>
          {selectedType && (
            <DataSourceForm
              dataSource={exampleDataSources[selectedType]}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Example: Complete Demo Page
 * 
 * A complete demo page showing all examples together.
 */
export default function DataSourceFormExamples() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">DataSourceForm Examples</h1>
        <p className="text-muted-foreground">
          Interactive examples demonstrating the DataSourceForm component in various scenarios.
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Create Mode</h2>
          <p className="text-muted-foreground">
            Create a new data source from scratch. The form starts with empty fields.
          </p>
          <CreateDataSourceExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Edit Mode</h2>
          <p className="text-muted-foreground">
            Edit an existing data source. The form pre-fills with current values and the type
            selector is disabled.
          </p>
          <EditDataSourceExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">All Data Source Types</h2>
          <p className="text-muted-foreground">
            Explore the different configuration fields for each data source type.
          </p>
          <AllDataSourceTypesExample />
        </section>
      </div>
    </div>
  )
}
