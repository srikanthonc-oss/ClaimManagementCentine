import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
} from './use-media-query'

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(event: MediaQueryListEvent) => void> = []

  return {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.push(listener)
    }),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }),
    addEventListener: vi.fn(
      (event: string, listener: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners.push(listener)
        }
      }
    ),
    removeEventListener: vi.fn(
      (event: string, listener: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          const index = listeners.indexOf(listener)
          if (index > -1) {
            listeners.splice(index, 1)
          }
        }
      }
    ),
    dispatchEvent: vi.fn(),
    // Helper to trigger change events
    triggerChange: (newMatches: boolean) => {
      listeners.forEach((listener) => {
        listener({ matches: newMatches } as MediaQueryListEvent)
      })
    },
    listeners,
  }
}

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => matchMediaMock as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false initially for SSR safety', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('should return true when media query matches', () => {
    matchMediaMock = createMatchMediaMock(true)
    window.matchMedia = vi.fn(() => matchMediaMock as any)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('should update when media query match changes', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)

    // Simulate viewport resize that triggers media query change
    act(() => {
      matchMediaMock.triggerChange(true)
    })

    expect(result.current).toBe(true)

    // Simulate another resize
    act(() => {
      matchMediaMock.triggerChange(false)
    })

    expect(result.current).toBe(false)
  })

  it('should call addEventListener with correct parameters', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('should cleanup event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    unmount()

    expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('should handle query changes', () => {
    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 768px)' } }
    )

    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)')

    // Change the query
    rerender({ query: '(min-width: 1024px)' })

    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
  })

  it('should handle multiple simultaneous media queries', () => {
    const { result: result1 } = renderHook(() =>
      useMediaQuery('(min-width: 768px)')
    )
    const { result: result2 } = renderHook(() =>
      useMediaQuery('(max-width: 767px)')
    )

    expect(result1.current).toBe(false)
    expect(result2.current).toBe(false)
  })

  it('should work with complex media queries', () => {
    const complexQuery =
      '(min-width: 768px) and (max-width: 1024px) and (orientation: landscape)'

    renderHook(() => useMediaQuery(complexQuery))

    expect(window.matchMedia).toHaveBeenCalledWith(complexQuery)
  })

  it('should handle fallback to addListener for older browsers', () => {
    // Create mock without addEventListener
    const oldBrowserMock = {
      ...matchMediaMock,
      addEventListener: undefined,
      removeEventListener: undefined,
    }

    window.matchMedia = vi.fn(() => oldBrowserMock as any)

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(oldBrowserMock.addListener).toHaveBeenCalledWith(
      expect.any(Function)
    )

    unmount()

    expect(oldBrowserMock.removeListener).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })
})

describe('useIsMobile', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => matchMediaMock as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false for non-mobile viewport', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return true for mobile viewport', () => {
    matchMediaMock = createMatchMediaMock(true)
    window.matchMedia = vi.fn(() => matchMediaMock as any)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should use correct media query', () => {
    renderHook(() => useIsMobile())
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 639px)')
  })

  it('should update when viewport changes', () => {
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      matchMediaMock.triggerChange(true)
    })

    expect(result.current).toBe(true)
  })
})

describe('useIsTablet', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => matchMediaMock as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false for non-tablet viewport', () => {
    const { result } = renderHook(() => useIsTablet())
    expect(result.current).toBe(false)
  })

  it('should return true for tablet viewport', () => {
    matchMediaMock = createMatchMediaMock(true)
    window.matchMedia = vi.fn(() => matchMediaMock as any)

    const { result } = renderHook(() => useIsTablet())
    expect(result.current).toBe(true)
  })

  it('should use correct media query', () => {
    renderHook(() => useIsTablet())
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(min-width: 640px) and (max-width: 1023px)'
    )
  })
})

describe('useIsDesktop', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => matchMediaMock as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false for non-desktop viewport', () => {
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(false)
  })

  it('should return true for desktop viewport', () => {
    matchMediaMock = createMatchMediaMock(true)
    window.matchMedia = vi.fn(() => matchMediaMock as any)

    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })

  it('should use correct media query', () => {
    renderHook(() => useIsDesktop())
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
  })
})

describe('usePrefersReducedMotion', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => matchMediaMock as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false when user does not prefer reduced motion', () => {
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('should return true when user prefers reduced motion', () => {
    matchMediaMock = createMatchMediaMock(true)
    window.matchMedia = vi.fn(() => matchMediaMock as any)

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('should use correct media query', () => {
    renderHook(() => usePrefersReducedMotion())
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)'
    )
  })

  it('should update when preference changes', () => {
    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(false)

    act(() => {
      matchMediaMock.triggerChange(true)
    })

    expect(result.current).toBe(true)
  })
})

describe('usePrefersDarkMode', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => matchMediaMock as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false when user does not prefer dark mode', () => {
    const { result } = renderHook(() => usePrefersDarkMode())
    expect(result.current).toBe(false)
  })

  it('should return true when user prefers dark mode', () => {
    matchMediaMock = createMatchMediaMock(true)
    window.matchMedia = vi.fn(() => matchMediaMock as any)

    const { result } = renderHook(() => usePrefersDarkMode())
    expect(result.current).toBe(true)
  })

  it('should use correct media query', () => {
    renderHook(() => usePrefersDarkMode())
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-color-scheme: dark)'
    )
  })

  it('should update when OS theme changes', () => {
    const { result } = renderHook(() => usePrefersDarkMode())

    expect(result.current).toBe(false)

    act(() => {
      matchMediaMock.triggerChange(true)
    })

    expect(result.current).toBe(true)
  })
})

describe('Responsive design integration', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => matchMediaMock as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle viewport transitions from mobile to desktop', () => {
    const { result: mobileResult } = renderHook(() => useIsMobile())
    const { result: desktopResult } = renderHook(() => useIsDesktop())

    // Start on mobile
    expect(mobileResult.current).toBe(false)
    expect(desktopResult.current).toBe(false)

    // Simulate resize to desktop
    act(() => {
      matchMediaMock.triggerChange(true)
    })

    // Both hooks should update independently
    expect(mobileResult.current).toBe(true)
    expect(desktopResult.current).toBe(true)
  })

  it('should support custom breakpoints for specific components', () => {
    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 1280px)')
    )

    expect(result.current).toBe(false)

    act(() => {
      matchMediaMock.triggerChange(true)
    })

    expect(result.current).toBe(true)
  })
})
