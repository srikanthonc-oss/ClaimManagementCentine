import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Navigation } from './navigation'
import { ThemeProvider } from './theme-provider'

// Mock Next.js navigation hooks
const mockPush = vi.fn()
const mockPathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const renderNavigation = () => {
  return render(
    <ThemeProvider defaultTheme="light">
      <Navigation />
    </ThemeProvider>
  )
}

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue('/')
    // Reset body overflow
    document.body.style.overflow = 'unset'
  })

  describe('Desktop Navigation', () => {
    it('renders all navigation links', () => {
      renderNavigation()

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Data Sources')).toBeInTheDocument()
      expect(screen.getByText('File Intake')).toBeInTheDocument()
      expect(screen.getByText('Pend Processing')).toBeInTheDocument()
    })

    it('renders the brand/logo link', () => {
      renderNavigation()

      const brandLink = screen.getByText('Claims Management')
      expect(brandLink).toBeInTheDocument()
      expect(brandLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('renders theme toggle button', () => {
      renderNavigation()

      const themeButtons = screen.getAllByRole('button', {
        name: /switch to (dark|light) theme/i,
      })
      expect(themeButtons.length).toBeGreaterThan(0)
    })

    it('highlights active navigation link on dashboard', () => {
      mockPathname.mockReturnValue('/')
      renderNavigation()

      const dashboardLinks = screen.getAllByText('Dashboard')
      const activeLink = dashboardLinks.find(
        (link) => link.closest('a')?.getAttribute('aria-current') === 'page'
      )
      expect(activeLink).toBeInTheDocument()
    })

    it('highlights active navigation link on data sources page', () => {
      mockPathname.mockReturnValue('/data-sources')
      renderNavigation()

      const dataSourcesLinks = screen.getAllByText('Data Sources')
      const activeLink = dataSourcesLinks.find(
        (link) => link.closest('a')?.getAttribute('aria-current') === 'page'
      )
      expect(activeLink).toBeInTheDocument()
    })

    it('highlights active navigation link on file intake page', () => {
      mockPathname.mockReturnValue('/file-intake')
      renderNavigation()

      const fileIntakeLinks = screen.getAllByText('File Intake')
      const activeLink = fileIntakeLinks.find(
        (link) => link.closest('a')?.getAttribute('aria-current') === 'page'
      )
      expect(activeLink).toBeInTheDocument()
    })

    it('highlights active navigation link on pend processing page', () => {
      mockPathname.mockReturnValue('/pend-processing')
      renderNavigation()

      const pendProcessingLinks = screen.getAllByText('Pend Processing')
      const activeLink = pendProcessingLinks.find(
        (link) => link.closest('a')?.getAttribute('aria-current') === 'page'
      )
      expect(activeLink).toBeInTheDocument()
    })

    it('renders icons for each navigation link', () => {
      renderNavigation()

      // Check that SVG icons are present (lucide-react renders SVGs)
      const links = screen.getAllByRole('link')
      const linksWithIcons = links.filter((link) => {
        const svg = link.querySelector('svg')
        return svg !== null
      })

      // Should have at least the 4 nav links with icons (plus brand link without icon)
      expect(linksWithIcons.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Mobile Navigation', () => {
    it('renders mobile menu button', () => {
      renderNavigation()

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('opens mobile menu when hamburger button is clicked', () => {
      renderNavigation()

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)

      const mobileMenu = screen.getByRole('button', { name: /close menu/i })
      expect(mobileMenu).toBeInTheDocument()
    })

    it('closes mobile menu when close button is clicked', () => {
      renderNavigation()

      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(openButton)

      // Close menu
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      fireEvent.click(closeButton)

      // Menu should be closed
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('closes mobile menu when backdrop is clicked', () => {
      renderNavigation()

      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(openButton)

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0.top-16')
      expect(backdrop).toBeInTheDocument()
      fireEvent.click(backdrop!)

      // Menu should be closed
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('prevents body scroll when mobile menu is open', () => {
      renderNavigation()

      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(openButton)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when mobile menu is closed', () => {
      renderNavigation()

      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(openButton)

      // Close menu
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      fireEvent.click(closeButton)

      expect(document.body.style.overflow).toBe('unset')
    })

    it('displays all navigation links in mobile menu', () => {
      renderNavigation()

      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(openButton)

      // Check for mobile menu container
      const mobileMenu = document.querySelector('#mobile-menu')
      expect(mobileMenu).toBeInTheDocument()

      // All links should be present
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Data Sources').length).toBeGreaterThan(0)
      expect(screen.getAllByText('File Intake').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Pend Processing').length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-current attribute on active link', () => {
      mockPathname.mockReturnValue('/data-sources')
      renderNavigation()

      const dataSourcesLinks = screen.getAllByText('Data Sources')
      const activeLink = dataSourcesLinks.find(
        (link) => link.closest('a')?.getAttribute('aria-current') === 'page'
      )
      expect(activeLink).toBeInTheDocument()
    })

    it('has proper aria-label on mobile menu button', () => {
      renderNavigation()

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu')
    })

    it('has proper aria-expanded attribute on mobile menu button', () => {
      renderNavigation()

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(menuButton)

      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('has proper aria-controls attribute on mobile menu button', () => {
      renderNavigation()

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu')
    })

    it('icons have aria-hidden attribute', () => {
      renderNavigation()

      const icons = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Theme Integration', () => {
    it('renders theme toggle in desktop view', () => {
      renderNavigation()

      const themeButtons = screen.getAllByRole('button', {
        name: /switch to (dark|light) theme/i,
      })
      expect(themeButtons.length).toBeGreaterThan(0)
    })

    it('renders theme toggle in mobile view', () => {
      renderNavigation()

      // Theme toggle should be visible even before opening mobile menu
      const themeButtons = screen.getAllByRole('button', {
        name: /switch to (dark|light) theme/i,
      })
      expect(themeButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Behavior', () => {
    it('applies sticky positioning to navigation', () => {
      renderNavigation()

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('sticky')
      expect(nav).toHaveClass('top-0')
    })

    it('applies backdrop blur effect', () => {
      renderNavigation()

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('backdrop-blur')
    })

    it('applies border styling', () => {
      renderNavigation()

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('border-b')
      expect(nav).toHaveClass('border-border')
    })
  })
})
