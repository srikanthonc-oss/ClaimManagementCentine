import { useEffect, useState, useCallback } from 'react'

/**
 * useLocalStorage Hook
 * 
 * Persists state to localStorage and synchronizes it across browser tabs/windows.
 * Provides a similar API to useState but with automatic persistence.
 * 
 * Features:
 * - Automatic serialization/deserialization with JSON
 * - Synchronization across browser tabs using storage events
 * - SSR-safe (handles server-side rendering gracefully)
 * - Type-safe with TypeScript generics
 * - Error handling for storage quota and parsing errors
 * 
 * @template T - The type of the value being stored
 * @param key - The localStorage key to use
 * @param initialValue - The initial value if no stored value exists
 * @returns A tuple of [storedValue, setValue, removeValue]
 * 
 * @example
 * ```tsx
 * function UserPreferences() {
 *   const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light')
 *   const [fontSize, setFontSize] = useLocalStorage('fontSize', 16)
 * 
 *   return (
 *     <div>
 *       <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *         Toggle Theme
 *       </button>
 *       <button onClick={removeTheme}>Reset Theme</button>
 *     </div>
 *   )
 * }
 * ```
 * 
 * **Validates: Requirements 8.4, 8.5**
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR safety: return initial value if window is undefined
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or return initialValue if nothing stored
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      // If error (e.g., parsing error), return initial value
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        // Use functional update to get the latest state
        setStoredValue((currentValue) => {
          const valueToStore =
            value instanceof Function ? value(currentValue) : value

          // Save to local storage
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }

          return valueToStore
        })
      } catch (error) {
        // Handle storage quota exceeded or other errors
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key]
  )

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      // Reset to initial value
      setStoredValue(initialValue)

      // Remove from local storage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this key in other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to changes to our specific key
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T)
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error)
        }
      } else if (e.key === key && e.newValue === null) {
        // Key was removed in another tab
        setStoredValue(initialValue)
      }
    }

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange)

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
