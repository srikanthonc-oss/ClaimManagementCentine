'use client'

import * as React from 'react'
import { Edit, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatRelativeDate } from '@/lib/utils'
import type { DataSource } from '@/types'

export interface DataSourceListProps {
  /**
   * Array of data sources to display
   */
  dataSources: DataSource[]

  /**
   * Callback when edit button is clicked
   */
  onEdit: (id: string) => void

  /**
   * Callback when delete button is clicked
   */
  onDelete: (id: string) => void

  /**
   * Optional CSS classes for styling
   */
  className?: string
}

/**
 * DataSourceList Component
 * 
 * Displays all configured data sources in a table format with edit and delete actions.
 * Shows data source name, type, status, and last sync time.
 * 
 * Features:
 * - Table display with all data source information
 * - Status indicators with color coding (active, inactive, error)
 * - Edit and Delete action buttons for each data source
 * - Last sync time displayed as relative time
 * - Empty state when no data sources exist
 * - Responsive design with horizontal scrolling on mobile
 * - Supports both light and dark themes
 * 
 * @param dataSources - Array of data source objects to display
 * @param onEdit - Callback function when edit button is clicked, receives data source ID
 * @param onDelete - Callback function when delete button is clicked, receives data source ID
 * @param className - Optional CSS classes for styling
 * 
 * @example
 * ```tsx
 * <DataSourceList 
 *   dataSources={dataSourcesArray}
 *   onEdit={(id) => handleEdit(id)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 * ```
 * 
 * **Validates: Requirements 2.1, 2.8, 2.9**
 */
export function DataSourceList({
  dataSources,
  onEdit,
  onDelete,
  className,
}: DataSourceListProps) {
  /**
   * Get status indicator with icon and styling based on data source status
   */
  const getStatusIndicator = (status: DataSource['status']) => {
    const statusConfig = {
      active: {
        icon: CheckCircle2,
        label: 'Active',
        className: 'text-green-600 dark:text-green-400',
        bgClassName: 'bg-green-100 dark:bg-green-900/30',
      },
      inactive: {
        icon: AlertCircle,
        label: 'Inactive',
        className: 'text-gray-600 dark:text-gray-400',
        bgClassName: 'bg-gray-100 dark:bg-gray-900/30',
      },
      error: {
        icon: XCircle,
        label: 'Error',
        className: 'text-red-600 dark:text-red-400',
        bgClassName: 'bg-red-100 dark:bg-red-900/30',
      },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
          config.bgClassName,
          config.className
        )}
        aria-label={`Status: ${config.label}`}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        {config.label}
      </span>
    )
  }

  // Empty state
  if (dataSources.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <p className="text-muted-foreground">No data sources configured</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Add a data source to start integrating claims data
        </p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Sync</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataSources.map((dataSource) => (
            <TableRow key={dataSource.id}>
              <TableCell className="font-medium">{dataSource.name}</TableCell>
              <TableCell>{dataSource.type}</TableCell>
              <TableCell>{getStatusIndicator(dataSource.status)}</TableCell>
              <TableCell>
                {dataSource.lastSync ? (
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(dataSource.lastSync)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(dataSource.id)}
                    aria-label={`Edit ${dataSource.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(dataSource.id)}
                    aria-label={`Delete ${dataSource.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
