import { useEffect, useState } from 'react'

/**
 * useDebounce Hook
 * 
 * Debounces a rapidly changing value by delaying updates until the value
 * has stopped changing for a specified delay period.
 * 
 * This is particularly useful for search inputs where you want to wait
 * until the user has stopped typing before triggering an expensive operation
 * like filtering or API calls.
 * 
 * @template T - The type of the value being debounced
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms per requirements)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('')
 *   const debouncedSearchTerm = useDebounce(searchTerm, 300)
 * 
 *   useEffect(() => {
 *     // This will only run when the user stops typing for 300ms
 *     if (debouncedSearchTerm) {
 *       performSearch(debouncedSearchTerm)
 *     }
 *   }, [debouncedSearchTerm])
 * 
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *     />
 *   )
 * }
 * ```
 * 
 * **Validates: Requirements 12.6**
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if value changes before delay expires
    // This ensures we only update after the user stops changing the value
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
