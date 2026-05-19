'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataSourceList } from '@/components/data-source-list'
import { DataSourceForm } from '@/components/data-source-form'
import { ErrorDisplay } from '@/components/error-display'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import type { DataSource } from '@/types'

/**
 * DataSourcesPage Component
 * 
 * Main page for managing data source configurations.
 * Provides CRUD operations for data sources with dialog-based forms.
 * 
 * Features:
 * - Display list of all configured data sources
 * - Add new data sources via dialog form
 * - Edit existing data sources via dialog form
 * - Delete data sources with confirmation dialog
 * - Error handling for all CRUD operations
 * - Integration with Zustand store for state management
 * - Supports both light and dark themes
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 11.1**
 */
export default function DataSourcesPage() {
  // Store state and actions
  const dataSources = useDataSourcesStore((state) => state.dataSources)
  const addDataSource = useDataSourcesStore((state) => state.addDataSource)
  const updateDataSource = useDataSourcesStore((state) => state.updateDataSource)
  const deleteDataSource = useDataSourcesStore((state) => state.deleteDataSource)
  const getDataSourceById = useDataSourcesStore((state) => state.getDataSourceById)

  // Dialog state
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [editingDataSourceId, setEditingDataSourceId] = React.useState<string | null>(null)
  const [deletingDataSourceId, setDeletingDataSourceId] = React.useState<string | null>(null)

  // Error state
  const [error, setError] = React.useState<string | null>(null)

  /**
   * Get the data source being edited
   */
  const editingDataSource = React.useMemo(() => {
    if (!editingDataSourceId) return undefined
    return getDataSourceById(editingDataSourceId)
  }, [editingDataSourceId, getDataSourceById])

  /**
   * Get the data source being deleted
   */
  const deletingDataSource = React.useMemo(() => {
    if (!deletingDataSourceId) return undefined
    return getDataSourceById(deletingDataSourceId)
  }, [deletingDataSourceId, getDataSourceById])

  /**
   * Handle opening the form dialog for adding a new data source
   */
  const handleAddClick = () => {
    setEditingDataSourceId(null)
    setError(null)
    setIsFormDialogOpen(true)
  }

  /**
   * Handle opening the form dialog for editing an existing data source
   */
  const handleEditClick = (id: string) => {
    setEditingDataSourceId(id)
    setError(null)
    setIsFormDialogOpen(true)
  }

  /**
   * Handle opening the delete confirmation dialog
   */
  const handleDeleteClick = (id: string) => {
    setDeletingDataSourceId(id)
    setError(null)
    setIsDeleteDialogOpen(true)
  }

  /**
   * Handle form submission for adding or editing a data source
   */
  const handleFormSubmit = (data: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingDataSourceId) {
        // Update existing data source
        const result = updateDataSource(editingDataSourceId, data)
        if (!result.success) {
          setError(result.error || 'Failed to update data source')
          return
        }
      } else {
        // Add new data source
        const newDataSource: DataSource = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        const result = addDataSource(newDataSource)
        if (!result.success) {
          setError(result.error || 'Failed to add data source')
          return
        }
      }

      // Close dialog on success
      setIsFormDialogOpen(false)
      setEditingDataSourceId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  /**
   * Handle form cancellation
   */
  const handleFormCancel = () => {
    setIsFormDialogOpen(false)
    setEditingDataSourceId(null)
    setError(null)
  }

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = () => {
    try {
      if (!deletingDataSourceId) return

      deleteDataSource(deletingDataSourceId)
      setIsDeleteDialogOpen(false)
      setDeletingDataSourceId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsDeleteDialogOpen(false)
    }
  }

  /**
   * Handle delete cancellation
   */
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeletingDataSourceId(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage data source connections for claims processing
          </p>
        </div>
        <Button onClick={handleAddClick} aria-label="Add new data source">
          <Plus className="mr-2 h-4 w-4" />
          Add Data Source
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <ErrorDisplay
            title="Error"
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Data Sources List */}
      <DataSourceList
        dataSources={dataSources}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Add/Edit Data Source Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingDataSourceId ? 'Edit Data Source' : 'Add Claims Data Source'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingDataSourceId
                ? 'Update the data source configuration.'
                : 'Connect a new upstream feed'}
            </DialogDescription>
          </DialogHeader>
          <DataSourceForm
            dataSource={editingDataSource}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the data source{' '}
              <strong>{deletingDataSource?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
