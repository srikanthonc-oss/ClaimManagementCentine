import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './theme-toggle'
import { ThemeProvider } from './theme-provider'

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('renders the theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: /switch to/i })
    expect(button).toBeInTheDocument()
  })

  it('displays sun icon in light theme', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
  })

  it('displays moon icon in dark theme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
  })

  it('toggles theme from light to dark when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')

    await user.click(button)

    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('toggles theme from dark to light when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')

    await user.click(button)

    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('supports keyboard navigation with Enter key', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    button.focus()
    
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')

    await user.keyboard('{Enter}')

    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
  })

  it('supports keyboard navigation with Space key', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    button.focus()
    
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')

    await user.keyboard(' ')

    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
  })

  it('has accessible title attribute', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Switch to dark theme')
  })

  it('has screen reader only text', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const srText = screen.getByText('Switch to dark theme', { selector: '.sr-only' })
    expect(srText).toBeInTheDocument()
    expect(srText).toHaveClass('sr-only')
  })

  it('applies transition classes for smooth animation', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('transition-all', 'duration-500')
  })

  it('persists theme preference across multiple toggles', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')

    // Toggle to dark
    await user.click(button)
    expect(localStorage.getItem('theme')).toBe('dark')

    // Toggle back to light
    await user.click(button)
    expect(localStorage.getItem('theme')).toBe('light')

    // Toggle to dark again
    await user.click(button)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('uses ghost variant button style', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    // The button should have ghost variant classes applied
    expect(button.className).toContain('hover:bg-accent')
  })

  it('uses icon size button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    // Icon size buttons are square (h-10 w-10)
    expect(button.className).toMatch(/h-10/)
    expect(button.className).toMatch(/w-10/)
  })
})
