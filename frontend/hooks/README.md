# Custom React Hooks

This directory contains reusable custom React hooks for the Claims Management UI application.

## Available Hooks

### useDebounce

Debounces a rapidly changing value by delaying updates until the value has stopped changing for a specified delay period.

**Use Case:** Search inputs where you want to wait until the user stops typing before triggering expensive operations like filtering or API calls.

**Parameters:**
- `value: T` - The value to debounce
- `delay: number` - The delay in milliseconds (default: 300ms)

**Returns:** The debounced value

**Example:**
```tsx
import { useDebounce } from '@/hooks'

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    // This will only run when the user stops typing for 300ms
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search claims..."
    />
  )
}
```

**Validates Requirements:** 12.6 (debounce search input with 300ms delay)

---

### useLocalStorage

Persists state to localStorage and synchronizes it across browser tabs/windows. Provides a similar API to useState but with automatic persistence.

**Features:**
- Automatic JSON serialization/deserialization
- Synchronization across browser tabs using storage events
- SSR-safe (handles server-side rendering gracefully)
- Type-safe with TypeScript generics
- Error handling for storage quota and parsing errors

**Parameters:**
- `key: string` - The localStorage key to use
- `initialValue: T` - The initial value if no stored value exists

**Returns:** A tuple of `[storedValue, setValue, removeValue]`

**Example:**
```tsx
import { useLocalStorage } from '@/hooks'

function UserPreferences() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light')
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 16)

  return (
    <div>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme: {theme}
      </button>
      <button onClick={() => setFontSize(fontSize + 2)}>
        Increase Font Size: {fontSize}px
      </button>
      <button onClick={removeTheme}>
        Reset Theme
      </button>
    </div>
  )
}
```

**Validates Requirements:** 8.4, 8.5 (persist theme preference across sessions)

---

### useMediaQuery

Tracks the state of a CSS media query and updates when the match status changes. Useful for implementing responsive behavior in React components.

**Features:**
- Real-time updates when viewport size changes
- SSR-safe (handles server-side rendering gracefully)
- Automatic cleanup of event listeners
- Works with any valid CSS media query

**Parameters:**
- `query: string` - A valid CSS media query string (e.g., '(min-width: 768px)')

**Returns:** Boolean indicating whether the media query matches

**Example:**
```tsx
import { useMediaQuery, useIsMobile, useIsDesktop } from '@/hooks'

function ResponsiveComponent() {
  const isMobile = useIsMobile()
  const isDesktop = useIsDesktop()
  const isLargeScreen = useMediaQuery('(min-width: 1280px)')

  return (
    <div>
      {isMobile && <MobileNav />}
      {isDesktop && <DesktopNav />}
      {isLargeScreen && <SidePanel />}
    </div>
  )
}
```

**Predefined Breakpoint Hooks:**
- `useIsMobile()` - Returns true if viewport width < 640px
- `useIsTablet()` - Returns true if viewport width is 640px - 1023px
- `useIsDesktop()` - Returns true if viewport width >= 1024px
- `usePrefersReducedMotion()` - Returns true if user prefers reduced motion
- `usePrefersDarkMode()` - Returns true if user's OS is set to dark mode

**Common Tailwind CSS Breakpoints:**
- sm: `'(min-width: 640px)'`
- md: `'(min-width: 768px)'`
- lg: `'(min-width: 1024px)'`
- xl: `'(min-width: 1280px)'`
- 2xl: `'(min-width: 1536px)'`

**Validates Requirements:** 9.6, 17.4 (responsive design)

---

## Testing

All hooks have comprehensive unit tests with 100% coverage. Run tests with:

```bash
npm test -- hooks
```

## Implementation Notes

### useDebounce
- Uses `useEffect` with cleanup to manage timers
- Cancels pending updates when value changes before delay expires
- Works with any data type (strings, numbers, objects, arrays)

### useLocalStorage
- Handles JSON parsing errors gracefully
- Synchronizes across tabs using the `storage` event
- Provides a `removeValue` function to reset to initial value
- Catches and logs quota exceeded errors

### useMediaQuery
- Uses `window.matchMedia` API
- Supports both modern (`addEventListener`) and legacy (`addListener`) APIs
- Returns `false` initially for SSR safety to prevent hydration mismatches
- Cleans up event listeners on unmount

## Best Practices

1. **useDebounce**: Use for search inputs, form validation, and any rapidly changing values that trigger expensive operations.

2. **useLocalStorage**: Use for user preferences, theme settings, and any state that should persist across sessions. Avoid storing sensitive data.

3. **useMediaQuery**: Use for responsive layouts, conditional rendering based on viewport size, and accessibility features (reduced motion, color scheme preferences).

## Related Files

- `hooks/index.ts` - Main export file
- `hooks/use-debounce.ts` - useDebounce implementation
- `hooks/use-debounce.test.ts` - useDebounce tests
- `hooks/use-local-storage.ts` - useLocalStorage implementation
- `hooks/use-local-storage.test.ts` - useLocalStorage tests
- `hooks/use-media-query.ts` - useMediaQuery implementation
- `hooks/use-media-query.test.ts` - useMediaQuery tests
