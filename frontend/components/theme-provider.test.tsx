import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from './theme-provider'
import userEvent from '@testing-library/user-event'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Test component that uses the theme hook
function TestComponent() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.clear()
    document.documentElement.className = ''
  })

  it('should render children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should default to light theme when no stored theme exists', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })

  it('should use defaultTheme prop when provided', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })
  })

  it('should load theme from localStorage on mount', async () => {
    localStorageMock.setItem('theme', 'dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })
  })

  it('should apply theme class to document root element', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })
  })

  it('should switch theme and update localStorage', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(getByTestId('current-theme')).toHaveTextContent('light')
    })

    // Switch to dark theme
    await user.click(getByTestId('set-dark'))

    await waitFor(() => {
      expect(getByTestId('current-theme')).toHaveTextContent('dark')
      expect(localStorageMock.getItem('theme')).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    // Switch back to light theme
    await user.click(getByTestId('set-light'))

    await waitFor(() => {
      expect(getByTestId('current-theme')).toHaveTextContent('light')
      expect(localStorageMock.getItem('theme')).toBe('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })

  it('should remove previous theme class when switching themes', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    await user.click(getByTestId('set-dark'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })
  })

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleError.mockRestore()
  })

  it('should persist theme across remounts', async () => {
    localStorageMock.setItem('theme', 'dark')

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    unmount()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })
  })

  it('should handle invalid localStorage values gracefully', async () => {
    localStorageMock.setItem('theme', 'invalid-theme')

    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      // Should fall back to defaultTheme
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })
})
