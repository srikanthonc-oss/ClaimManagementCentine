'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

/**
 * ThemeToggle Component
 * 
 * A button component that toggles between light and dark themes.
 * Features:
 * - Sun icon for light theme, Moon icon for dark theme
 * - Smooth 500ms transition between themes
 * - Accessible labels and keyboard support
 * - Integrates with ThemeProvider context
 * 
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="relative transition-all duration-500"
    >
      {/* Sun icon - shown in dark theme (click to switch to light) */}
      <Sun
        className={`h-5 w-5 transition-all duration-500 ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
        aria-hidden="true"
      />
      
      {/* Moon icon - shown in light theme (click to switch to dark) */}
      <Moon
        className={`absolute h-5 w-5 transition-all duration-500 ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
        aria-hidden="true"
      />
      
      <span className="sr-only">
        {theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      </span>
    </Button>
  )
}
