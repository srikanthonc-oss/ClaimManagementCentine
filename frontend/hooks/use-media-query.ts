import { useEffect, useState } from 'react'

/**
 * useMediaQuery Hook
 * 
 * Tracks the state of a CSS media query and updates when the match status changes.
 * Useful for implementing responsive behavior in React components.
 * 
 * Features:
 * - Real-time updates when viewport size changes
 * - SSR-safe (handles server-side rendering gracefully)
 * - Automatic cleanup of event listeners
 * - Works with any valid CSS media query
 * 
 * @param query - A valid CSS media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating whether the media query matches
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 640px)')
 *   const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
 *   const isDesktop = useMediaQuery('(min-width: 1025px)')
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
 * 
 *   return (
 *     <div>
 *       {isMobile && <MobileNav />}
 *       {isTablet && <TabletNav />}
 *       {isDesktop && <DesktopNav />}
 *     </div>
 *   )
 * }
 * ```
 * 
 * Common Tailwind CSS breakpoints:
 * - sm: '(min-width: 640px)'
 * - md: '(min-width: 768px)'
 * - lg: '(min-width: 1024px)'
 * - xl: '(min-width: 1280px)'
 * - 2xl: '(min-width: 1536px)'
 * 
 * **Validates: Requirements 9.6, 17.4**
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false for SSR safety
  // This prevents hydration mismatches between server and client
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    // SSR safety: only run in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Create media query list
    const mediaQueryList = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQueryList.matches)

    // Define event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers support addEventListener
    // Older browsers use addListener (deprecated but still supported)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      // @ts-ignore - addListener is deprecated but still exists
      mediaQueryList.addListener(handleChange)
    }

    // Clean up event listener on unmount
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        // @ts-ignore - removeListener is deprecated but still exists
        mediaQueryList.removeListener(handleChange)
      }
    }
  }, [query]) // Re-run effect if query changes

  return matches
}

/**
 * Predefined media query hooks for common Tailwind CSS breakpoints
 * These provide convenient shortcuts for the most common responsive scenarios
 */

/**
 * Check if viewport is mobile size (< 640px)
 * @returns true if viewport width is less than 640px
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}

/**
 * Check if viewport is tablet size (640px - 1023px)
 * @returns true if viewport width is between 640px and 1023px
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

/**
 * Check if viewport is desktop size (>= 1024px)
 * @returns true if viewport width is 1024px or greater
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Check if user prefers reduced motion
 * Useful for accessibility - disable animations for users who prefer reduced motion
 * @returns true if user has enabled reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Check if user prefers dark color scheme at OS level
 * Note: This is different from the app's theme setting
 * @returns true if user's OS is set to dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}
