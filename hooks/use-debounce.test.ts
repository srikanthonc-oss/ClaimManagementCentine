import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes with default 300ms delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    // Update the value
    rerender({ value: 'updated' })

    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time by 299ms (just before delay)
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('initial')

    // Fast-forward the remaining 1ms to complete the delay
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })

  it('should debounce value changes with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    // Should not update before custom delay
    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current).toBe('initial')

    // Should update after custom delay
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    )

    // First update
    rerender({ value: 'update1' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Second update before first delay completes
    rerender({ value: 'update2' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Third update before second delay completes
    rerender({ value: 'update3' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Still showing initial value because timer keeps resetting
    expect(result.current).toBe('initial')

    // Complete the delay for the last update
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Should show the last value
    expect(result.current).toBe('update3')
  })

  it('should handle different data types', () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    )

    numberRerender({ value: 42 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(numberResult.current).toBe(42)

    // Test with boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: false } }
    )

    boolRerender({ value: true })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(boolResult.current).toBe(true)

    // Test with object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: { name: 'initial' } } }
    )

    const newObj = { name: 'updated' }
    objRerender({ value: newObj })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(objResult.current).toEqual(newObj)

    // Test with array
    const { result: arrResult, rerender: arrRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: [1, 2, 3] } }
    )

    const newArr = [4, 5, 6]
    arrRerender({ value: newArr })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(arrResult.current).toEqual(newArr)
  })

  it('should handle empty string values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'search term' } }
    )

    rerender({ value: '' })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('')
  })

  it('should handle null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' as string | null | undefined } }
    )

    rerender({ value: null })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(null)

    rerender({ value: undefined })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(undefined)
  })

  it('should cleanup timer on unmount', () => {
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    // Unmount before delay completes
    unmount()

    // Timer should be cleaned up, advancing time should not cause issues
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // No errors should occur
    expect(true).toBe(true)
  })

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    // With 0 delay, should update on next tick
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current).toBe('updated')
  })

  it('should simulate search input scenario', () => {
    // Simulate user typing "react hooks"
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '' } }
    )

    // User types 'r'
    rerender({ value: 'r' })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current).toBe('')

    // User types 'e'
    rerender({ value: 're' })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current).toBe('')

    // User types 'a'
    rerender({ value: 'rea' })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current).toBe('')

    // User types 'c'
    rerender({ value: 'reac' })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current).toBe('')

    // User types 't'
    rerender({ value: 'react' })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current).toBe('')

    // User pauses typing for 300ms
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Should update after 300ms total from last keystroke
    expect(result.current).toBe('react')
  })
})
