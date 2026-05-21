import { NextRequest, NextResponse } from 'next/server'
import type { DataSource, DataSourceType } from '@/types'
import {
  DataSourceTypeSchema,
  validateDataSourceConfig,
  formatValidationErrors,
} from '@/lib/schemas'

// In-memory storage for data sources (demo purposes)
let dataSources: DataSource[] = [
  {
    id: 'ds-1',
    name: 'Primary Claims API',
    type: 'Claims API',
    config: {
      endpoint: 'https://api.claims.example.com/v1',
      apiKey: 'demo-api-key-001',
      timeout: 30000,
    },
    status: 'active',
    lastSync: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 'ds-2',
    name: 'EDI Partner Gateway',
    type: 'EDI Gateway',
    config: {
      host: 'edi.partner.example.com',
      port: 5080,
      username: 'edi_user',
      password: 'edi_pass_demo',
    },
    status: 'active',
    lastSync: new Date('2024-01-14T08:00:00Z'),
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-14T08:00:00Z'),
  },
  {
    id: 'ds-3',
    name: 'Claims File Upload',
    type: 'File Upload',
    config: {
      allowedExtensions: ['.xls', '.xlsx'],
      maxFileSize: 52428800,
    },
    status: 'active',
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-03T00:00:00Z'),
  },
  {
    id: 'ds-4',
    name: 'FHIR R4 Server',
    type: 'FHIR API',
    config: {
      baseUrl: 'https://fhir.example.com/r4',
      version: 'R4',
      authToken: 'demo-fhir-token',
    },
    status: 'inactive',
    createdAt: new Date('2024-01-04T00:00:00Z'),
    updatedAt: new Date('2024-01-04T00:00:00Z'),
  },
  {
    id: 'ds-5',
    name: 'Claims SFTP Feed',
    type: 'SFTP Feed',
    config: {
      host: 'sftp.claims.example.com',
      port: 22,
      username: 'sftp_user',
      privateKey: 'demo-private-key',
      remotePath: '/incoming/claims',
    },
    status: 'error',
    lastSync: new Date('2024-01-10T06:00:00Z'),
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-10T06:00:00Z'),
  },
]

/**
 * Validates connection parameters for a data source.
 * In a real application, this would attempt to connect to the external system.
 * For this demo, it validates the configuration structure.
 */
function validateConnection(type: DataSourceType, config: unknown): { valid: boolean; error?: string } {
  const result = validateDataSourceConfig(type, config)
  if (!result.success) {
    return {
      valid: false,
      error: result.errors ? formatValidationErrors(result.errors) : 'Invalid connection parameters',
    }
  }
  return { valid: true }
}

/**
 * GET /api/data-sources
 * Returns all configured data sources.
 *
 * Query Parameters:
 * - type: Filter by data source type (optional)
 * - status: Filter by status (active, inactive, error) (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as DataSourceType | null
    const status = searchParams.get('status') as 'active' | 'inactive' | 'error' | null

    // Validate type filter
    if (type) {
      const typeValidation = DataSourceTypeSchema.safeParse(type)
      if (!typeValidation.success) {
        return NextResponse.json(
          { error: `Invalid type value. Must be one of: Claims API, EDI Gateway, File Upload, FHIR API, SFTP Feed` },
          { status: 400 }
        )
      }
    }

    // Validate status filter
    const validStatuses = ['active', 'inactive', 'error']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Apply filters
    let filtered = dataSources

    if (type) {
      filtered = filtered.filter((ds) => ds.type === type)
    }

    if (status) {
      filtered = filtered.filter((ds) => ds.status === status)
    }

    return NextResponse.json({
      dataSources: filtered,
      total: filtered.length,
    })
  } catch (error) {
    console.error('Error fetching data sources:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching data sources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/data-sources
 * Creates a new data source.
 *
 * Request Body:
 * - name: string (required)
 * - type: DataSourceType (required)
 * - config: DataSourceConfig (required, validated based on type)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, type, config } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Data source name is required' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Data source type is required' },
        { status: 400 }
      )
    }

    // Validate type
    const typeValidation = DataSourceTypeSchema.safeParse(type)
    if (!typeValidation.success) {
      return NextResponse.json(
        { error: `Invalid data source type. Must be one of: Claims API, EDI Gateway, File Upload, FHIR API, SFTP Feed` },
        { status: 400 }
      )
    }

    if (!config) {
      return NextResponse.json(
        { error: 'Data source configuration is required' },
        { status: 400 }
      )
    }

    // Validate connection parameters
    const connectionValidation = validateConnection(type, config)
    if (!connectionValidation.valid) {
      return NextResponse.json(
        { error: `Connection validation failed: ${connectionValidation.error}` },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existingByName = dataSources.find(
      (ds) => ds.name.toLowerCase() === name.trim().toLowerCase()
    )
    if (existingByName) {
      return NextResponse.json(
        { error: 'A data source with this name already exists' },
        { status: 409 }
      )
    }

    // Create new data source
    const now = new Date()
    const newDataSource: DataSource = {
      id: `ds-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      type,
      config,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }

    dataSources.push(newDataSource)

    return NextResponse.json(
      { dataSource: newDataSource, message: 'Data source created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    console.error('Error creating data source:', error)
    return NextResponse.json(
      { error: 'Internal server error while creating data source' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/data-sources
 * Updates an existing data source.
 *
 * Request Body:
 * - id: string (required)
 * - name: string (optional)
 * - type: DataSourceType (optional)
 * - config: DataSourceConfig (optional, validated based on type)
 * - status: 'active' | 'inactive' | 'error' (optional)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const { id, name, type, config, status } = body

    // Validate ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Data source ID is required' },
        { status: 400 }
      )
    }

    // Find existing data source
    const existingIndex = dataSources.findIndex((ds) => ds.id === id)
    if (existingIndex === -1) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      )
    }

    const existing = dataSources[existingIndex]

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Data source name cannot be empty' },
          { status: 400 }
        )
      }

      // Check for duplicate name (excluding current)
      const duplicateName = dataSources.find(
        (ds) => ds.id !== id && ds.name.toLowerCase() === name.trim().toLowerCase()
      )
      if (duplicateName) {
        return NextResponse.json(
          { error: 'A data source with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Validate type if provided
    if (type !== undefined) {
      const typeValidation = DataSourceTypeSchema.safeParse(type)
      if (!typeValidation.success) {
        return NextResponse.json(
          { error: `Invalid data source type. Must be one of: Claims API, EDI Gateway, File Upload, FHIR API, SFTP Feed` },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive', 'error']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate config if provided (use new type or existing type)
    if (config !== undefined) {
      const configType = type || existing.type
      const connectionValidation = validateConnection(configType, config)
      if (!connectionValidation.valid) {
        return NextResponse.json(
          { error: `Connection validation failed: ${connectionValidation.error}` },
          { status: 400 }
        )
      }
    }

    // Apply updates
    const updatedDataSource: DataSource = {
      ...existing,
      ...(name !== undefined && { name: name.trim() }),
      ...(type !== undefined && { type }),
      ...(config !== undefined && { config }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    }

    dataSources[existingIndex] = updatedDataSource

    return NextResponse.json({
      dataSource: updatedDataSource,
      message: 'Data source updated successfully',
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    console.error('Error updating data source:', error)
    return NextResponse.json(
      { error: 'Internal server error while updating data source' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/data-sources
 * Removes a data source.
 *
 * Query Parameters:
 * - id: string (required) - The ID of the data source to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Data source ID is required as a query parameter' },
        { status: 400 }
      )
    }

    // Find existing data source
    const existingIndex = dataSources.findIndex((ds) => ds.id === id)
    if (existingIndex === -1) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      )
    }

    const deleted = dataSources[existingIndex]
    dataSources = dataSources.filter((ds) => ds.id !== id)

    return NextResponse.json({
      dataSource: deleted,
      message: 'Data source deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting data source:', error)
    return NextResponse.json(
      { error: 'Internal server error while deleting data source' },
      { status: 500 }
    )
  }
}
