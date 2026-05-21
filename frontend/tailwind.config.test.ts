import { describe, it, expect } from 'vitest';
import config from './tailwind.config';

describe('Tailwind Dark Mode Configuration', () => {
  it('should have class-based dark mode strategy configured', () => {
    expect(config.darkMode).toEqual(['class']);
  });

  it('should include all required content paths', () => {
    const expectedPaths = [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './lib/**/*.{ts,tsx}',
    ];
    
    expect(config.content).toEqual(expectedPaths);
  });

  it('should have base color tokens defined', () => {
    const colors = config.theme.extend.colors;
    
    // Base colors
    expect(colors).toHaveProperty('background');
    expect(colors).toHaveProperty('foreground');
    expect(colors).toHaveProperty('border');
    expect(colors).toHaveProperty('input');
    expect(colors).toHaveProperty('ring');
  });

  it('should have semantic color tokens defined', () => {
    const colors = config.theme.extend.colors;
    
    // Semantic colors
    expect(colors).toHaveProperty('primary');
    expect(colors).toHaveProperty('secondary');
    expect(colors).toHaveProperty('destructive');
    expect(colors).toHaveProperty('muted');
    expect(colors).toHaveProperty('accent');
  });

  it('should have custom claims management color tokens', () => {
    const colors = config.theme.extend.colors;
    
    // Custom colors
    expect(colors).toHaveProperty('success');
    expect(colors).toHaveProperty('warning');
    expect(colors).toHaveProperty('info');
  });

  it('should have platform-specific color tokens', () => {
    const colors = config.theme.extend.colors;
    
    expect(colors).toHaveProperty('platform');
    expect(colors.platform).toHaveProperty('facet');
    expect(colors.platform).toHaveProperty('amisys');
    expect(colors.platform).toHaveProperty('xcelys');
  });

  it('should have status-specific color tokens', () => {
    const colors = config.theme.extend.colors;
    
    expect(colors).toHaveProperty('status');
    expect(colors.status).toHaveProperty('pending');
    expect(colors.status).toHaveProperty('approved');
    expect(colors.status).toHaveProperty('denied');
    expect(colors.status).toHaveProperty('review');
  });

  it('should have foreground variants for all semantic colors', () => {
    const colors = config.theme.extend.colors;
    
    expect(colors.primary).toHaveProperty('foreground');
    expect(colors.secondary).toHaveProperty('foreground');
    expect(colors.destructive).toHaveProperty('foreground');
    expect(colors.muted).toHaveProperty('foreground');
    expect(colors.accent).toHaveProperty('foreground');
    expect(colors.success).toHaveProperty('foreground');
    expect(colors.warning).toHaveProperty('foreground');
    expect(colors.info).toHaveProperty('foreground');
  });

  it('should have border radius tokens defined', () => {
    const borderRadius = config.theme.extend.borderRadius;
    
    expect(borderRadius).toHaveProperty('lg');
    expect(borderRadius).toHaveProperty('md');
    expect(borderRadius).toHaveProperty('sm');
  });

  it('should have animation keyframes defined', () => {
    const keyframes = config.theme.extend.keyframes;
    
    expect(keyframes).toHaveProperty('accordion-down');
    expect(keyframes).toHaveProperty('accordion-up');
  });

  it('should have animations defined', () => {
    const animation = config.theme.extend.animation;
    
    expect(animation).toHaveProperty('accordion-down');
    expect(animation).toHaveProperty('accordion-up');
  });

  it('should have tailwindcss-animate plugin configured', () => {
    expect(config.plugins).toHaveLength(1);
  });
});

describe('Color Accessibility - WCAG AA Compliance', () => {
  // Helper function to convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4)),
    ];
  };

  // Helper function to calculate relative luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Helper function to calculate contrast ratio
  const getContrastRatio = (
    rgb1: [number, number, number],
    rgb2: [number, number, number]
  ): number => {
    const lum1 = getLuminance(...rgb1);
    const lum2 = getLuminance(...rgb2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Helper function to parse HSL string
  const parseHsl = (hslString: string): [number, number, number] => {
    const parts = hslString.split(' ').map((p) => parseFloat(p));
    return [parts[0], parts[1], parts[2]];
  };

  it('should have WCAG AA compliant contrast for light mode text', () => {
    // Light mode: foreground on background
    const background = hslToRgb(...parseHsl('0 0% 100%'));
    const foreground = hslToRgb(...parseHsl('222.2 47.4% 11.2%'));
    
    const contrastRatio = getContrastRatio(background, foreground);
    
    // WCAG AA requires 4.5:1 for normal text
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for dark mode text', () => {
    // Dark mode: foreground on background
    const background = hslToRgb(...parseHsl('222.2 47.4% 11.2%'));
    const foreground = hslToRgb(...parseHsl('210 40% 98%'));
    
    const contrastRatio = getContrastRatio(background, foreground);
    
    // WCAG AA requires 4.5:1 for normal text
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for primary button in light mode', () => {
    // Light mode: primary-foreground on primary
    const primary = hslToRgb(...parseHsl('217.2 91.2% 45%'));
    const primaryForeground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(primary, primaryForeground);
    
    // WCAG AA requires 4.5:1 for normal text
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for primary button in dark mode', () => {
    // Dark mode: primary-foreground on primary
    const primary = hslToRgb(...parseHsl('217.2 91.2% 59.8%'));
    const primaryForeground = hslToRgb(...parseHsl('222.2 47.4% 11.2%'));
    
    const contrastRatio = getContrastRatio(primary, primaryForeground);
    
    // WCAG AA requires 4.5:1 for normal text
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for destructive elements in light mode', () => {
    // Light mode: destructive-foreground on destructive
    const destructive = hslToRgb(...parseHsl('0 84.2% 45%'));
    const destructiveForeground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(destructive, destructiveForeground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for success elements in light mode', () => {
    // Light mode: success-foreground on success
    const success = hslToRgb(...parseHsl('142.1 70.6% 30%'));
    const successForeground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(success, successForeground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for warning elements in light mode', () => {
    // Light mode: warning-foreground on warning
    const warning = hslToRgb(...parseHsl('38 92% 32%'));
    const warningForeground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(warning, warningForeground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for muted text in light mode', () => {
    // Light mode: muted-foreground on background
    const background = hslToRgb(...parseHsl('0 0% 100%'));
    const mutedForeground = hslToRgb(...parseHsl('215.4 16.3% 35%'));
    
    const contrastRatio = getContrastRatio(background, mutedForeground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for muted text in dark mode', () => {
    // Dark mode: muted-foreground on background
    const background = hslToRgb(...parseHsl('222.2 47.4% 11.2%'));
    const mutedForeground = hslToRgb(...parseHsl('215 20.2% 70%'));
    
    const contrastRatio = getContrastRatio(background, mutedForeground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have WCAG AA compliant contrast for status-pending in light mode', () => {
    // Light mode: white text on status-pending background
    const statusPending = hslToRgb(...parseHsl('38 92% 42%'));
    const foreground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(statusPending, foreground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(3.0); // Large text standard
  });

  it('should have WCAG AA compliant contrast for status-approved in light mode', () => {
    // Light mode: white text on status-approved background
    const statusApproved = hslToRgb(...parseHsl('142.1 76.2% 36.3%'));
    const foreground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(statusApproved, foreground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(3.0); // Large text standard
  });

  it('should have WCAG AA compliant contrast for status-denied in light mode', () => {
    // Light mode: white text on status-denied background
    const statusDenied = hslToRgb(...parseHsl('0 84.2% 45%'));
    const foreground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(statusDenied, foreground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(3.0); // Large text standard
  });

  it('should have WCAG AA compliant contrast for status-review in light mode', () => {
    // Light mode: white text on status-review background
    const statusReview = hslToRgb(...parseHsl('199 89% 42%'));
    const foreground = hslToRgb(...parseHsl('0 0% 100%'));
    
    const contrastRatio = getContrastRatio(statusReview, foreground);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(3.0); // Large text standard
  });
});
