'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageLoaderProps {
  message?: string
  variant?: 'default' | 'cards' | 'table'
}

/**
 * Animated page loader with pulsing skeleton cards.
 * Shows while data is being fetched from the API.
 */
export function PageLoader({ message = 'Loading data...', variant = 'default' }: PageLoaderProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Animated header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-3 w-72 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Metric cards skeleton */}
      {(variant === 'default' || variant === 'cards') && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="h-2.5 w-20 rounded bg-muted/50 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              <div className="h-8 w-16 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
            </div>
          ))}
        </div>
      )}

      {/* Table skeleton */}
      {(variant === 'default' || variant === 'table') && (
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-3 rounded bg-muted/60 animate-pulse" style={{ width: `${60 + i * 15}px`, animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
          {/* Table rows */}
          {[...Array(6)].map((_, row) => (
            <div key={row} className="flex items-center gap-4 px-4 py-3 border-b border-border/30">
              {[...Array(6)].map((_, col) => (
                <div
                  key={col}
                  className="h-3 rounded bg-muted/40 animate-pulse"
                  style={{
                    width: `${40 + ((row + col) % 4) * 20}px`,
                    animationDelay: `${(row * 6 + col) * 50}ms`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    </div>
  )
}
