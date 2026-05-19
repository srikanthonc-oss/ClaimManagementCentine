'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  AlertCircle, 
  WifiOff, 
  FileX, 
  ServerCrash, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react'

export type ErrorType = 'connection' | 'parsing' | 'network' | 'validation' | 'general'

export interface ErrorDisplayProps {
  /**
   * The type of error to display
   */
  type?: ErrorType

  /**
   * The error title/heading
   */
  title?: string

  /**
   * The error message to display
   */
  message: string

  /**
   * Optional detailed error information
   */
  details?: string

  /**
   * Optional retry callback function
   * If provided, a retry button will be displayed
   */
  onRetry?: () => void

  /**
   * Optional dismiss callback function
   * If provided, a dismiss button will be displayed
   */
  onDismiss?: () => void

  /**
   * Whether the retry action is currently in progress
   */
  isRetrying?: boolean

  /**
   * Optional additional CSS classes
   */
  className?: string

  /**
   * Display variant - 'card' for full card layout, 'inline' for compact inline display
   */
  variant?: 'card' | 'inline'
}

/**
 * ErrorDisplay Component
 * 
 * A reusable component for displaying error messages in a user-friendly way.
 * Used throughout the application to show errors from API calls, file uploads,
 * validation failures, etc.
 * 
 * Features:
 * - Different error types with appropriate icons and colors
 * - Optional retry action button
 * - Optional dismiss button
 * - Supports both card and inline variants
 * - Accessible with proper ARIA labels
 * - Supports both light and dark themes
 * 
 * Error Types:
 * - connection: Data source connection failures
 * - parsing: File parsing errors
 * - network: Network request failures
 * - validation: Data validation errors
 * - general: Generic errors
 * 
 * @example
 * ```tsx
 * <ErrorDisplay 
 *   type="network"
 *   message="Failed to fetch claims data"
 *   onRetry={() => refetch()}
 *   isRetrying={isLoading}
 * />
 * ```
 */
export function ErrorDisplay({
  type = 'general',
  title,
  message,
  details,
  onRetry,
  onDismiss,
  isRetrying = false,
  className,
  variant = 'card',
}: ErrorDisplayProps) {
  // Get icon and default title based on error type
  const getErrorConfig = () => {
    switch (type) {
      case 'connection':
        return {
          icon: <ServerCrash className="h-5 w-5" />,
          defaultTitle: 'Connection Failed',
          colorClass: 'text-red-600 dark:text-red-400',
          bgClass: 'bg-red-50 dark:bg-red-950/20',
          borderClass: 'border-red-200 dark:border-red-900',
        }
      case 'parsing':
        return {
          icon: <FileX className="h-5 w-5" />,
          defaultTitle: 'Parsing Error',
          colorClass: 'text-orange-600 dark:text-orange-400',
          bgClass: 'bg-orange-50 dark:bg-orange-950/20',
          borderClass: 'border-orange-200 dark:border-orange-900',
        }
      case 'network':
        return {
          icon: <WifiOff className="h-5 w-5" />,
          defaultTitle: 'Network Error',
          colorClass: 'text-red-600 dark:text-red-400',
          bgClass: 'bg-red-50 dark:bg-red-950/20',
          borderClass: 'border-red-200 dark:border-red-900',
        }
      case 'validation':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          defaultTitle: 'Validation Error',
          colorClass: 'text-yellow-600 dark:text-yellow-400',
          bgClass: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderClass: 'border-yellow-200 dark:border-yellow-900',
        }
      case 'general':
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          defaultTitle: 'Error',
          colorClass: 'text-red-600 dark:text-red-400',
          bgClass: 'bg-red-50 dark:bg-red-950/20',
          borderClass: 'border-red-200 dark:border-red-900',
        }
    }
  }

  const config = getErrorConfig()
  const displayTitle = title || config.defaultTitle

  // Inline variant - compact display
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-md border p-4',
          config.bgClass,
          config.borderClass,
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className={cn('mt-0.5 flex-shrink-0', config.colorClass)} aria-hidden="true">
          {config.icon}
        </div>
        <div className="flex-1 space-y-1">
          <p className={cn('text-sm font-medium', config.colorClass)}>
            {displayTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          {details && (
            <p className="text-xs text-muted-foreground mt-1">
              {details}
            </p>
          )}
        </div>
        {(onRetry || onDismiss) && (
          <div className="flex gap-2 flex-shrink-0">
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
                aria-label="Retry"
              >
                <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                aria-label="Dismiss error"
              >
                ×
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Card variant - full card layout
  return (
    <Card
      className={cn(
        'border-l-4',
        config.borderClass,
        config.bgClass,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={cn('flex-shrink-0', config.colorClass)} aria-hidden="true">
            {config.icon}
          </div>
          <CardTitle className={cn('text-lg', config.colorClass)}>
            {displayTitle}
          </CardTitle>
        </div>
        <CardDescription className="text-base">
          {message}
        </CardDescription>
      </CardHeader>
      
      {details && (
        <CardContent>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
              {details}
            </p>
          </div>
        </CardContent>
      )}

      {(onRetry || onDismiss) && (
        <CardFooter className="flex gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
