import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useLocalStorage } from './use-local-storage'

describe('useLocalStorage', () => {
  // Store original setItem to restore after quota test
  let originalSetItem: typeof Storage.prototype.setItem

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Clear all mocks
    vi.clearAllMocks()
    // Store original setItem
    originalSetItem = Storage.prototype.setItem
  })

  afterEach(() => {
    localStorage.clear()
    // Always restore original setItem
    Storage.prototype.setItem = originalSetItem
  })

  it('should return initial value when no stored value exists', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    const [value] = result.current
    expect(value).toBe('initial-value')
  })

  it('should return stored value if it exists', () => {
    // Pre-populate localStorage
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    const [value] = result.current
    expect(value).toBe('stored-value')
  })

  it('should update localStorage when value is set', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    const [, setValue] = result.current

    act(() => {
      setValue('new-value')
    })

    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
    expect(result.current[0]).toBe('new-value')
  })

  it('should support functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0))

    const [, setValue] = result.current

    act(() => {
      setValue((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      setValue((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(2)
  })

  it('should remove value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    const [, , removeValue] = result.current

    act(() => {
      removeValue()
    })

    expect(localStorage.getItem('test-key')).toBeNull()
    expect(result.current[0]).toBe('initial-value')
  })

  it('should handle different data types', () => {
    // Number
    const { result: numberResult } = renderHook(() =>
      useLocalStorage('number', 42)
    )
    expect(numberResult.current[0]).toBe(42)

    // Boolean
    const { result: boolResult } = renderHook(() =>
      useLocalStorage('boolean', true)
    )
    expect(boolResult.current[0]).toBe(true)

    // Object
    const { result: objResult } = renderHook(() =>
      useLocalStorage('object', { name: 'test', count: 5 })
    )
    expect(objResult.current[0]).toEqual({ name: 'test', count: 5 })

    // Array
    const { result: arrResult } = renderHook(() =>
      useLocalStorage('array', [1, 2, 3])
    )
    expect(arrResult.current[0]).toEqual([1, 2, 3])

    // Null
    const { result: nullResult } = renderHook(() =>
      useLocalStorage('null', null)
    )
    expect(nullResult.current[0]).toBeNull()
  })

  it('should handle complex nested objects', () => {
    const complexObject = {
      user: {
        name: 'John Doe',
        preferences: {
          theme: 'dark',
          notifications: true,
          settings: {
            fontSize: 16,
            language: 'en',
          },
        },
      },
      metadata: {
        lastLogin: '2024-01-01',
        version: '1.0.0',
      },
    }

    const { result } = renderHook(() =>
      useLocalStorage('complex', complexObject)
    )

    expect(result.current[0]).toEqual(complexObject)

    const updatedObject = {
      ...complexObject,
      user: {
        ...complexObject.user,
        preferences: {
          ...complexObject.user.preferences,
          theme: 'light',
        },
      },
    }

    act(() => {
      result.current[1](updatedObject)
    })

    expect(result.current[0]).toEqual(updatedObject)
    expect(JSON.parse(localStorage.getItem('complex')!)).toEqual(updatedObject)
  })

  it('should handle invalid JSON in localStorage gracefully', () => {
    // Store invalid JSON
    localStorage.setItem('test-key', 'invalid-json{')

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'fallback-value')
    )

    // Should return initial value when parsing fails
    expect(result.current[0]).toBe('fallback-value')
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should handle localStorage errors gracefully', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    // Store invalid JSON to test error handling on read
    localStorage.setItem('error-test-key', 'invalid-json{')

    // Hook should handle parse error and return initial value
    const { result } = renderHook(() =>
      useLocalStorage('error-test-key', 'fallback-value')
    )

    expect(result.current[0]).toBe('fallback-value')
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should read the same value from localStorage when using same key', () => {
    // First hook sets a value
    const { result: result1 } = renderHook(() =>
      useLocalStorage('shared-key', 'initial')
    )

    act(() => {
      result1.current[1]('updated')
    })

    // Value should be in localStorage
    expect(localStorage.getItem('shared-key')).toBe(JSON.stringify('updated'))

    // Second hook created after the update should read the updated value
    const { result: result2 } = renderHook(() =>
      useLocalStorage('shared-key', 'initial')
    )

    // Second hook should read the updated value from localStorage
    expect(result2.current[0]).toBe('updated')
  })

  it('should handle storage events from other tabs', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    expect(result.current[0]).toBe('initial-value')

    // Simulate storage event from another tab
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify('value-from-other-tab'),
        oldValue: JSON.stringify('initial-value'),
        storageArea: localStorage,
      })
      window.dispatchEvent(storageEvent)
    })

    expect(result.current[0]).toBe('value-from-other-tab')
  })

  it('should handle storage event with null value (key removed)', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    expect(result.current[0]).toBe('stored-value')

    // Simulate storage event where key was removed in another tab
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: null,
        oldValue: JSON.stringify('stored-value'),
        storageArea: localStorage,
      })
      window.dispatchEvent(storageEvent)
    })

    // Should revert to initial value
    expect(result.current[0]).toBe('initial-value')
  })

  it('should ignore storage events for different keys', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    expect(result.current[0]).toBe('initial-value')

    // Simulate storage event for a different key
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify('other-value'),
        storageArea: localStorage,
      })
      window.dispatchEvent(storageEvent)
    })

    // Value should remain unchanged
    expect(result.current[0]).toBe('initial-value')
  })

  it('should handle invalid JSON in storage event gracefully', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    // Simulate storage event with invalid JSON
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: 'invalid-json{',
        storageArea: localStorage,
      })
      window.dispatchEvent(storageEvent)
    })

    // Value should remain unchanged
    expect(result.current[0]).toBe('initial-value')
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should cleanup storage event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'storage',
      expect.any(Function)
    )

    removeEventListenerSpy.mockRestore()
  })

  it('should persist theme preference across sessions', () => {
    // Simulate first session
    const { result: session1 } = renderHook(() =>
      useLocalStorage('theme', 'light')
    )

    act(() => {
      session1.current[1]('dark')
    })

    expect(localStorage.getItem('theme')).toBe(JSON.stringify('dark'))

    // Simulate second session (new page load)
    const { result: session2 } = renderHook(() =>
      useLocalStorage('theme', 'light')
    )

    // Should load the persisted value
    expect(session2.current[0]).toBe('dark')
  })

  it('should handle rapid updates correctly', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0))

    act(() => {
      result.current[1](1)
      result.current[1](2)
      result.current[1](3)
      result.current[1](4)
      result.current[1](5)
    })

    expect(result.current[0]).toBe(5)
    expect(JSON.parse(localStorage.getItem('counter')!)).toBe(5)
  })
})
