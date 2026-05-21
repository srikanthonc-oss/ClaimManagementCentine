import { create } from 'zustand'
import type { DataSource, DataSourceType } from '@/types'
import { validateDataSource, validateDataSourceConfig } from '@/lib/schemas'
import { api } from '@/lib/api'

/**
 * Data Sources Store State Interface
 */
interface DataSourcesState {
  // State
  dataSources: DataSource[]
  _hydrated: boolean

  // Actions
  setDataSources: (dataSources: DataSource[]) => void
  addDataSource: (dataSource: DataSource) => { success: boolean; error?: string }
  updateDataSource: (id: string, updates: Partial<DataSource>) => { success: boolean; error?: string }
  deleteDataSource: (id: string) => void
  fetchDataSources: () => Promise<void>

  // Selectors
  getDataSourceById: (id: string) => DataSource | undefined
  getDataSourcesByType: (type: DataSourceType) => DataSource[]
  getActiveDataSources: () => DataSource[]
  getDataSourcesByStatus: (status: 'active' | 'inactive' | 'error') => DataSource[]
}

/**
 * Zustand store for managing data sources
 * 
 * Provides centralized state management for data sources with:
 * - CRUD operations (set, add, update, delete)
 * - Validation logic for data source configurations
 * - Filtering by type and status
 * - Backend API sync with graceful fallback
 */
export const useDataSourcesStore = create<DataSourcesState>()(
  (set, get) => ({
    // Initial state
    dataSources: [],
    _hydrated: false,

    // Actions
    /**
     * Fetch data sources from the backend API
     */
    fetchDataSources: async () => {
      try {
        const data = await api.dataSources.list()
        set({ dataSources: data, _hydrated: true })
      } catch {
        // Backend unavailable — keep local state
        set({ _hydrated: true })
      }
    },

    /**
     * Replace all data sources with a new set
     * @param dataSources - Array of data sources to set
     */
    setDataSources: (dataSources: DataSource[]) => {
      set({ dataSources })
    },

    /**
     * Add a new data source with validation
     * Validates the data source structure and configuration before adding
     * Prevents duplicates by checking data source IDs and names
     * @param dataSource - Data source to add
     * @returns Object with success status and optional error message
     */
    addDataSource: (dataSource: DataSource) => {
      // Validate the data source structure
      const validation = validateDataSource(dataSource)
      if (!validation.success) {
        return {
          success: false,
          error: validation.errors?.map(e => e.message).join('; ') || 'Invalid data source',
        }
      }

      // Validate the configuration based on type
      const configValidation = validateDataSourceConfig(dataSource.type, dataSource.config)
      if (!configValidation.success) {
        return {
          success: false,
          error: configValidation.errors?.map(e => e.message).join('; ') || 'Invalid configuration',
        }
      }

      // Check for duplicate ID
      const existingById = get().dataSources.find(ds => ds.id === dataSource.id)
      if (existingById) {
        return {
          success: false,
          error: 'A data source with this ID already exists',
        }
      }

      // Check for duplicate name
      const existingByName = get().dataSources.find(ds => ds.name === dataSource.name)
      if (existingByName) {
        return {
          success: false,
          error: 'A data source with this name already exists',
        }
      }

      // Add the data source locally
      set((state) => ({
        dataSources: [...state.dataSources, dataSource],
      }))

      // Sync with backend — only send fields the API expects
      api.dataSources.create({
        name: dataSource.name,
        type: dataSource.type,
        config: dataSource.config || {},
        status: dataSource.status || 'active',
      }).catch(() => {})

      return { success: true }
    },

    /**
     * Update an existing data source by ID with validation
     * Validates configuration if it's being updated
     * @param id - The data source ID to update
     * @param updates - Partial data source object with fields to update
     * @returns Object with success status and optional error message
     */
    updateDataSource: (id: string, updates: Partial<DataSource>) => {
      const existingDataSource = get().dataSources.find(ds => ds.id === id)
      
      if (!existingDataSource) {
        return {
          success: false,
          error: 'Data source not found',
        }
      }

      // If updating name, check for duplicates
      if (updates.name && updates.name !== existingDataSource.name) {
        const duplicateName = get().dataSources.find(
          ds => ds.id !== id && ds.name === updates.name
        )
        if (duplicateName) {
          return {
            success: false,
            error: 'A data source with this name already exists',
          }
        }
      }

      // If updating config or type, validate the configuration
      if (updates.config || updates.type) {
        const typeToValidate = updates.type || existingDataSource.type
        const configToValidate = updates.config || existingDataSource.config
        
        const configValidation = validateDataSourceConfig(typeToValidate, configToValidate)
        if (!configValidation.success) {
          return {
            success: false,
            error: configValidation.errors?.map(e => e.message).join('; ') || 'Invalid configuration',
          }
        }
      }

      // Update the data source locally
      set((state) => ({
        dataSources: state.dataSources.map((ds) =>
          ds.id === id
            ? { ...ds, ...updates, updatedAt: new Date() }
            : ds
        ),
      }))

      // Sync with backend — only send fields the API expects
      const existing = get().dataSources.find(ds => ds.id === id)
      if (existing) {
        const updated = { ...existing, ...updates }
        api.dataSources.update(id, {
          name: updated.name,
          type: updated.type,
          config: updated.config || {},
          status: updated.status || 'active',
        }).catch(() => {})
      }

      return { success: true }
    },

    /**
     * Delete a data source by ID
     * @param id - The data source ID to delete
     */
    deleteDataSource: (id: string) => {
      set((state) => ({
        dataSources: state.dataSources.filter(ds => ds.id !== id),
      }))

      // Sync with backend
      api.dataSources.delete(id).catch(() => {})
    },

    // Selectors
    /**
     * Get a data source by ID
     * @param id - The data source ID to find
     * @returns The data source if found, undefined otherwise
     */
    getDataSourceById: (id: string) => {
      return get().dataSources.find(ds => ds.id === id)
    },

    /**
     * Get all data sources of a specific type
     * @param type - The data source type to filter by
     * @returns Array of data sources matching the type (deep copy)
     */
    getDataSourcesByType: (type: DataSourceType) => {
      return get().dataSources
        .filter(ds => ds.type === type)
        .map(ds => ({ ...ds }))
    },

    /**
     * Get all active data sources
     * @returns Array of active data sources (deep copy)
     */
    getActiveDataSources: () => {
      return get().dataSources
        .filter(ds => ds.status === 'active')
        .map(ds => ({ ...ds }))
    },

    /**
     * Get all data sources with a specific status
     * @param status - The status to filter by
     * @returns Array of data sources matching the status (deep copy)
     */
    getDataSourcesByStatus: (status: 'active' | 'inactive' | 'error') => {
      return get().dataSources
        .filter(ds => ds.status === status)
        .map(ds => ({ ...ds }))
    },
  })
)
