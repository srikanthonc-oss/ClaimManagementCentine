import { useEffect, useState } from 'react'

/**
 * Hook to detect if the component has hydrated (client-side).
 * Use this to prevent hydration mismatches with persisted stores.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}
