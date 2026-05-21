'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Claim,
  DataSource,
  FileUploadResult,
  Platform,
  Classification,
  ClaimStatus,
} from '@/types'

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const queryKeys = {
  claims: (filters?: ClaimsFilters) => ['claims', filters] as const,
  dataSources: () => ['data-sources'] as const,
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ClaimsFilters {
  platform?: Platform
  classification?: Classification
  status?: ClaimStatus
  page?: number
  pageSize?: number
}

export interface ClaimsResponse {
  claims: Claim[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DataSourceCreateInput {
  name: string
  type: DataSource['type']
  config: DataSource['config']
}

export interface DataSourceUpdateInput extends DataSourceCreateInput {
  id: string
}

// ─── Fetch Functions ────────────────────────────────────────────────────────

async function fetchClaims(filters?: ClaimsFilters): Promise<ClaimsResponse> {
  const params = new URLSearchParams()

  if (filters?.platform) params.set('platform', filters.platform)
  if (filters?.classification) params.set('classification', filters.classification)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.page) params.set('page', String(filters.page))
  if (filters?.pageSize) params.set('pageSize', String(filters.pageSize))

  const url = `/api/claims${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `Failed to fetch claims: ${response.status}`)
  }

  return response.json()
}

async function fetchDataSources(): Promise<DataSource[]> {
  const response = await fetch('/api/data-sources')

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `Failed to fetch data sources: ${response.status}`)
  }

  const data = await response.json()
  return data.dataSources ?? data
}

async function uploadFile(file: File): Promise<FileUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || `File upload failed: ${response.status}`)
  }

  return response.json()
}

async function createDataSource(input: DataSourceCreateInput): Promise<DataSource> {
  const response = await fetch('/api/data-sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Create failed' }))
    throw new Error(error.error || `Failed to create data source: ${response.status}`)
  }

  return response.json()
}

async function updateDataSource(input: DataSourceUpdateInput): Promise<DataSource> {
  const response = await fetch(`/api/data-sources/${input.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Update failed' }))
    throw new Error(error.error || `Failed to update data source: ${response.status}`)
  }

  return response.json()
}

async function deleteDataSource(id: string): Promise<void> {
  const response = await fetch(`/api/data-sources/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Delete failed' }))
    throw new Error(error.error || `Failed to delete data source: ${response.status}`)
  }
}

// ─── Query Hooks ────────────────────────────────────────────────────────────

/**
 * Fetches claims data with filtering, pagination, and auto-refresh.
 * - staleTime: 30s (claims data refreshes frequently)
 * - refetchInterval: 30s (auto-refresh for dashboard)
 */
export function useClaims(filters?: ClaimsFilters) {
  return useQuery({
    queryKey: queryKeys.claims(filters),
    queryFn: () => fetchClaims(filters),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

/**
 * Fetches data sources list with caching.
 * - staleTime: 60s (data sources change less frequently)
 */
export function useDataSources() {
  return useQuery({
    queryKey: queryKeys.dataSources(),
    queryFn: fetchDataSources,
    staleTime: 60 * 1000,
  })
}

// ─── Mutation Hooks ─────────────────────────────────────────────────────────

/**
 * Mutation hook for uploading XLS files.
 * Invalidates claims cache on success.
 */
export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
    },
  })
}

/**
 * Mutation hooks for data source CRUD operations.
 * Each mutation invalidates the data-sources cache on success.
 */
export function useCreateDataSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dataSources() })
    },
  })
}

export function useUpdateDataSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dataSources() })
    },
  })
}

export function useDeleteDataSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dataSources() })
    },
  })
}

/**
 * Convenience hook that returns all data source mutation hooks together.
 */
export function useDataSourceMutations() {
  return {
    create: useCreateDataSource(),
    update: useUpdateDataSource(),
    delete: useDeleteDataSource(),
  }
}
