'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  /**
   * Optional text to display below the spinner
   */
  text?: string

  /**
   * Size of the spinner
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg'

  /**
   * Optional additional CSS classes
   */
  className?: string

  /**
   * Whether to center the spinner in its container
   * @default false
   */
  centered?: boolean
}

/**
 * LoadingSpinner Component
 * 
 * A reusable loading indicator component that displays a spinning icon with optional text.
 * Used throughout the application to show loading states for data fetching, file uploads, etc.
 * 
 * Features:
 * - Smooth rotation animation
 * - Multiple size options (sm, default, lg)
 * - Optional loading text
 * - Optional centering in container
 * - Supports both light and dark themes
 * - Accessible with proper ARIA labels
 * 
 * @example
 * ```tsx
 * <LoadingSpinner text="Loading claims..." size="lg" centered />
 * ```
 */
export function LoadingSpinner({
  text,
  size = 'default',
  className,
  centered = false,
}: LoadingSpinnerProps) {
  // Size classes for the spinner icon
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  // Text size classes
  const textSizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
  }

  const spinnerContent = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        centered && 'min-h-[200px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Spinning icon */}
      <Loader2
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />

      {/* Optional loading text */}
      {text && (
        <p
          className={cn(
            'text-muted-foreground',
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}

      {/* Screen reader text */}
      <span className="sr-only">
        {text || 'Loading...'}
      </span>
    </div>
  )

  return spinnerContent
}
