import { describe, it, expect, beforeEach } from 'vitest'
import { useDataSourcesStore } from './data-sources-store'
import type { DataSource, ClaimsAPIConfig, EDIGatewayConfig, FileUploadConfig } from '@/types'

describe('DataSourcesStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useDataSourcesStore.setState({ dataSources: [] })
  })

  // Helper function to create a valid Claims API data source
  const createClaimsAPIDataSource = (overrides?: Partial<DataSource>): DataSource => ({
    id: 'ds-1',
    name: 'Test Claims API',
    type: 'Claims API',
    config: {
      endpoint: 'https://api.example.com/claims',
      apiKey: 'test-api-key-123',
      timeout: 5000,
    } as ClaimsAPIConfig,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  })

  // Helper function to create a valid EDI Gateway data source
  const createEDIGatewayDataSource = (overrides?: Partial<DataSource>): DataSource => ({
    id: 'ds-2',
    name: 'Test EDI Gateway',
    type: 'EDI Gateway',
    config: {
      host: 'edi.example.com',
      port: 22,
      username: 'edi-user',
      password: 'edi-password',
    } as EDIGatewayConfig,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  })

  // Helper function to create a valid File Upload data source
  const createFileUploadDataSource = (overrides?: Partial<DataSource>): DataSource => ({
    id: 'ds-3',
    name: 'Test File Upload',
    type: 'File Upload',
    config: {
      allowedExtensions: ['.xls', '.xlsx'],
      maxFileSize: 52428800, // 50MB
    } as FileUploadConfig,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  })

  describe('setDataSources', () => {
    it('should set data sources', () => {
      const dataSources = [createClaimsAPIDataSource(), createEDIGatewayDataSource()]
      
      useDataSourcesStore.getState().setDataSources(dataSources)
      
      expect(useDataSourcesStore.getState().dataSources).toEqual(dataSources)
    })

    it('should replace existing data sources', () => {
      const initial = [createClaimsAPIDataSource()]
      const replacement = [createEDIGatewayDataSource()]
      
      useDataSourcesStore.getState().setDataSources(initial)
      useDataSourcesStore.getState().setDataSources(replacement)
      
      expect(useDataSourcesStore.getState().dataSources).toEqual(replacement)
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(1)
    })

    it('should handle empty array', () => {
      useDataSourcesStore.getState().setDataSources([createClaimsAPIDataSource()])
      useDataSourcesStore.getState().setDataSources([])
      
      expect(useDataSourcesStore.getState().dataSources).toEqual([])
    })
  })

  describe('addDataSource', () => {
    it('should add a valid Claims API data source', () => {
      const dataSource = createClaimsAPIDataSource()
      
      const result = useDataSourcesStore.getState().addDataSource(dataSource)
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(1)
      expect(useDataSourcesStore.getState().dataSources[0]).toEqual(dataSource)
    })

    it('should add a valid EDI Gateway data source', () => {
      const dataSource = createEDIGatewayDataSource()
      
      const result = useDataSourcesStore.getState().addDataSource(dataSource)
      
      expect(result.success).toBe(true)
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(1)
    })

    it('should add a valid File Upload data source', () => {
      const dataSource = createFileUploadDataSource()
      
      const result = useDataSourcesStore.getState().addDataSource(dataSource)
      
      expect(result.success).toBe(true)
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(1)
    })

    it('should add multiple data sources', () => {
      const ds1 = createClaimsAPIDataSource()
      const ds2 = createEDIGatewayDataSource()
      const ds3 = createFileUploadDataSource()
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      useDataSourcesStore.getState().addDataSource(ds3)
      
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(3)
    })

    it('should reject data source with duplicate ID', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'duplicate-id' })
      const ds2 = createEDIGatewayDataSource({ id: 'duplicate-id', name: 'Different Name' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      const result = useDataSourcesStore.getState().addDataSource(ds2)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('ID already exists')
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(1)
    })

    it('should reject data source with duplicate name', () => {
      const ds1 = createClaimsAPIDataSource({ name: 'Duplicate Name' })
      const ds2 = createEDIGatewayDataSource({ id: 'different-id', name: 'Duplicate Name' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      const result = useDataSourcesStore.getState().addDataSource(ds2)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('name already exists')
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(1)
    })

    it('should reject data source with invalid endpoint URL', () => {
      const dataSource = createClaimsAPIDataSource({
        config: {
          endpoint: 'not-a-valid-url',
          apiKey: 'test-key',
        } as ClaimsAPIConfig,
      })
      
      const result = useDataSourcesStore.getState().addDataSource(dataSource)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject data source with invalid port number', () => {
      const dataSource = createEDIGatewayDataSource({
        config: {
          host: 'edi.example.com',
          port: 99999, // Invalid port
          username: 'user',
          password: 'pass',
        } as EDIGatewayConfig,
      })
      
      const result = useDataSourcesStore.getState().addDataSource(dataSource)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject data source with empty required fields', () => {
      const dataSource = createClaimsAPIDataSource({
        config: {
          endpoint: 'https://api.example.com',
          apiKey: '', // Empty API key
        } as ClaimsAPIConfig,
      })
      
      const result = useDataSourcesStore.getState().addDataSource(dataSource)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject data source with negative maxFileSize', () => {
      const dataSource = createFileUploadDataSource({
        config: {
          allowedExtensions: ['.xls'],
          maxFileSize: -1000, // Negative size
        } as FileUploadConfig,
      })
      
      const result = useDataSourcesStore.getState().addDataSource(dataSource)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('updateDataSource', () => {
    it('should update data source name', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().updateDataSource('ds-1', {
        name: 'Updated Name',
      })
      
      expect(result.success).toBe(true)
      const updated = useDataSourcesStore.getState().dataSources[0]
      expect(updated.name).toBe('Updated Name')
      expect(updated.updatedAt).not.toEqual(dataSource.updatedAt)
    })

    it('should update data source status', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().updateDataSource('ds-1', {
        status: 'inactive',
      })
      
      expect(result.success).toBe(true)
      expect(useDataSourcesStore.getState().dataSources[0].status).toBe('inactive')
    })

    it('should update data source configuration', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const newConfig: ClaimsAPIConfig = {
        endpoint: 'https://new-api.example.com/claims',
        apiKey: 'new-api-key',
        timeout: 10000,
      }
      
      const result = useDataSourcesStore.getState().updateDataSource('ds-1', {
        config: newConfig,
      })
      
      expect(result.success).toBe(true)
      expect(useDataSourcesStore.getState().dataSources[0].config).toEqual(newConfig)
    })

    it('should update lastSync timestamp', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const syncTime = new Date('2024-02-01')
      const result = useDataSourcesStore.getState().updateDataSource('ds-1', {
        lastSync: syncTime,
      })
      
      expect(result.success).toBe(true)
      expect(useDataSourcesStore.getState().dataSources[0].lastSync).toEqual(syncTime)
    })

    it('should reject update for non-existent data source', () => {
      const result = useDataSourcesStore.getState().updateDataSource('non-existent', {
        name: 'New Name',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should reject update with duplicate name', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'ds-1', name: 'Name 1' })
      const ds2 = createEDIGatewayDataSource({ id: 'ds-2', name: 'Name 2' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      
      const result = useDataSourcesStore.getState().updateDataSource('ds-2', {
        name: 'Name 1', // Duplicate of ds-1
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('name already exists')
    })

    it('should allow updating to same name', () => {
      const dataSource = createClaimsAPIDataSource({ name: 'Same Name' })
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().updateDataSource('ds-1', {
        name: 'Same Name',
        status: 'inactive',
      })
      
      expect(result.success).toBe(true)
    })

    it('should reject update with invalid configuration', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().updateDataSource('ds-1', {
        config: {
          endpoint: 'invalid-url',
          apiKey: 'key',
        } as ClaimsAPIConfig,
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate configuration when updating type', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      // Try to change type without updating config (config won't match new type)
      const result = useDataSourcesStore.getState().updateDataSource('ds-1', {
        type: 'EDI Gateway',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('deleteDataSource', () => {
    it('should delete data source by ID', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      useDataSourcesStore.getState().deleteDataSource('ds-1')
      
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(0)
    })

    it('should delete correct data source when multiple exist', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'ds-1' })
      const ds2 = createEDIGatewayDataSource({ id: 'ds-2' })
      const ds3 = createFileUploadDataSource({ id: 'ds-3' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      useDataSourcesStore.getState().addDataSource(ds3)
      
      useDataSourcesStore.getState().deleteDataSource('ds-2')
      
      const remaining = useDataSourcesStore.getState().dataSources
      expect(remaining).toHaveLength(2)
      expect(remaining.find(ds => ds.id === 'ds-1')).toBeDefined()
      expect(remaining.find(ds => ds.id === 'ds-3')).toBeDefined()
      expect(remaining.find(ds => ds.id === 'ds-2')).toBeUndefined()
    })

    it('should handle deleting non-existent data source gracefully', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      useDataSourcesStore.getState().deleteDataSource('non-existent')
      
      expect(useDataSourcesStore.getState().dataSources).toHaveLength(1)
    })
  })

  describe('getDataSourceById', () => {
    it('should return data source by ID', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const found = useDataSourcesStore.getState().getDataSourceById('ds-1')
      
      expect(found).toEqual(dataSource)
    })

    it('should return undefined for non-existent ID', () => {
      const found = useDataSourcesStore.getState().getDataSourceById('non-existent')
      
      expect(found).toBeUndefined()
    })

    it('should find correct data source among multiple', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'ds-1' })
      const ds2 = createEDIGatewayDataSource({ id: 'ds-2' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      
      const found = useDataSourcesStore.getState().getDataSourceById('ds-2')
      
      expect(found).toEqual(ds2)
    })
  })

  describe('getDataSourcesByType', () => {
    it('should return data sources filtered by type', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'ds-1' })
      const ds2 = createClaimsAPIDataSource({ id: 'ds-2', name: 'Another Claims API' })
      const ds3 = createEDIGatewayDataSource({ id: 'ds-3' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      useDataSourcesStore.getState().addDataSource(ds3)
      
      const claimsAPISources = useDataSourcesStore.getState().getDataSourcesByType('Claims API')
      
      expect(claimsAPISources).toHaveLength(2)
      expect(claimsAPISources.every(ds => ds.type === 'Claims API')).toBe(true)
    })

    it('should return empty array when no data sources match type', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().getDataSourcesByType('FHIR API')
      
      expect(result).toEqual([])
    })

    it('should return deep copy of data sources', () => {
      const dataSource = createClaimsAPIDataSource()
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().getDataSourcesByType('Claims API')
      result[0].name = 'Modified Name'
      
      expect(useDataSourcesStore.getState().dataSources[0].name).toBe('Test Claims API')
    })
  })

  describe('getActiveDataSources', () => {
    it('should return only active data sources', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'ds-1', status: 'active' })
      const ds2 = createEDIGatewayDataSource({ id: 'ds-2', status: 'inactive' })
      const ds3 = createFileUploadDataSource({ id: 'ds-3', status: 'active' })
      const ds4 = createClaimsAPIDataSource({ id: 'ds-4', name: 'Error Source', status: 'error' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      useDataSourcesStore.getState().addDataSource(ds3)
      useDataSourcesStore.getState().addDataSource(ds4)
      
      const active = useDataSourcesStore.getState().getActiveDataSources()
      
      expect(active).toHaveLength(2)
      expect(active.every(ds => ds.status === 'active')).toBe(true)
    })

    it('should return empty array when no active data sources', () => {
      const dataSource = createClaimsAPIDataSource({ status: 'inactive' })
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().getActiveDataSources()
      
      expect(result).toEqual([])
    })
  })

  describe('getDataSourcesByStatus', () => {
    it('should return data sources filtered by status', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'ds-1', status: 'active' })
      const ds2 = createEDIGatewayDataSource({ id: 'ds-2', status: 'inactive' })
      const ds3 = createFileUploadDataSource({ id: 'ds-3', status: 'error' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      useDataSourcesStore.getState().addDataSource(ds3)
      
      const inactive = useDataSourcesStore.getState().getDataSourcesByStatus('inactive')
      
      expect(inactive).toHaveLength(1)
      expect(inactive[0].status).toBe('inactive')
    })

    it('should return error status data sources', () => {
      const ds1 = createClaimsAPIDataSource({ id: 'ds-1', status: 'error' })
      const ds2 = createEDIGatewayDataSource({ id: 'ds-2', status: 'error' })
      
      useDataSourcesStore.getState().addDataSource(ds1)
      useDataSourcesStore.getState().addDataSource(ds2)
      
      const errors = useDataSourcesStore.getState().getDataSourcesByStatus('error')
      
      expect(errors).toHaveLength(2)
      expect(errors.every(ds => ds.status === 'error')).toBe(true)
    })

    it('should return deep copy of data sources', () => {
      const dataSource = createClaimsAPIDataSource({ status: 'active' })
      useDataSourcesStore.getState().addDataSource(dataSource)
      
      const result = useDataSourcesStore.getState().getDataSourcesByStatus('active')
      result[0].name = 'Modified Name'
      
      expect(useDataSourcesStore.getState().dataSources[0].name).toBe('Test Claims API')
    })
  })
})
