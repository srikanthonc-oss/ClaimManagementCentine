'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 30 seconds - data is considered fresh for 30s
            staleTime: 30 * 1000,
            // Cache time: 5 minutes - unused data stays in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Refetch on window focus for fresh data
            refetchOnWindowFocus: true,
            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
