# ThemeToggle Component

A fully accessible theme toggle component that switches between light and dark themes with smooth animations.

## Features

- **Visual Indicators**: Sun icon for light theme, Moon icon for dark theme (Lucide React)
- **Smooth Transitions**: 500ms animation between theme changes
- **Accessibility**: 
  - ARIA labels for screen readers
  - Keyboard navigation support (Enter and Space keys)
  - Focus indicators
  - Screen reader only text
- **Theme Persistence**: Automatically saves and restores user's theme preference
- **Integration**: Works seamlessly with the existing ThemeProvider

## Usage

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation items */}
      </nav>
      <ThemeToggle />
    </header>
  )
}
```

## Requirements Satisfied

This component satisfies the following requirements from the Claims Management UI specification:

### Requirement 8: Theme Support

- **8.1**: Provides light theme option ✓
- **8.2**: Provides dark theme option ✓
- **8.3**: Applies theme changes within 500ms ✓

## Implementation Details

### Component Structure

The component uses:
- `Button` component with `ghost` variant and `icon` size
- `Sun` and `Moon` icons from Lucide React
- `useTheme` hook from ThemeProvider for theme state management

### Accessibility Features

1. **ARIA Labels**: Dynamic `aria-label` that describes the action ("Switch to dark theme" or "Switch to light theme")
2. **Title Attribute**: Tooltip text for mouse users
3. **Screen Reader Text**: Hidden text with `.sr-only` class for screen readers
4. **Keyboard Support**: Full keyboard navigation with Enter and Space keys
5. **Focus Management**: Visible focus indicators for keyboard users

### Animation

The component uses CSS transitions with a 500ms duration:
- Icon rotation (0° to 90° and -90° to 0°)
- Scale transformation (0 to 1)
- Opacity changes (0 to 1)

This creates a smooth, professional transition between themes.

## Testing

The component includes comprehensive unit tests covering:
- Rendering in both light and dark themes
- Theme toggling functionality
- Keyboard navigation (Enter and Space keys)
- Accessibility attributes (ARIA labels, title, screen reader text)
- Theme persistence in localStorage
- Animation classes
- Button styling

Run tests with:
```bash
npm test -- theme-toggle.test.tsx
```

## Dependencies

- `lucide-react`: Icon library
- `@/components/ui/button`: Button component
- `@/components/theme-provider`: Theme context provider

## Browser Support

Works in all modern browsers that support:
- CSS transitions
- CSS transforms
- localStorage API
- ES6+ JavaScript features
