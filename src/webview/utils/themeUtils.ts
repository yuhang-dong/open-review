import { ThemeType } from '../types';

/**
 * Utility functions for VS Code theme detection and management
 * Enhanced for comprehensive theme system with CSS variables
 */
export class ThemeUtils {
  /**
   * Detect initial theme from VS Code CSS variables and DOM classes
   * This provides immediate theme detection before extension communication
   */
  static detectInitialTheme(): ThemeType {
    try {
      // Primary method: Check VS Code theme classes on body
      if (document.body.classList.contains('vscode-dark')) {
        return 'dark';
      } else if (document.body.classList.contains('vscode-light')) {
        return 'light';
      }
      
      // Secondary method: Check VS Code CSS variables to determine theme
      const backgroundColor = getComputedStyle(document.body).getPropertyValue('--vscode-editor-background');
      
      // Fallback: analyze background color brightness
      if (backgroundColor) {
        const brightness = this.calculateColorBrightness(backgroundColor);
        if (brightness !== null) {
          return brightness < 128 ? 'dark' : 'light';
        }
      }
      
      // Final fallback: check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    } catch (error) {
      console.warn('Failed to detect initial theme:', error);
      return 'light';
    }
  }

  /**
   * Calculate brightness of a color string (hex, rgb, rgba, hsl)
   * Returns null if color cannot be parsed
   */
  private static calculateColorBrightness(colorString: string): number | null {
    try {
      // Remove whitespace and convert to lowercase
      const color = colorString.trim().toLowerCase();
      
      // Handle hex colors
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
          const r = parseInt(hex[0]! + hex[0]!, 16);
          const g = parseInt(hex[1]! + hex[1]!, 16);
          const b = parseInt(hex[2]! + hex[2]!, 16);
          return this.rgbToBrightness(r, g, b);
        } else if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return this.rgbToBrightness(r, g, b);
        }
      }
      
      // Handle rgb/rgba colors
      const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
      if (rgbMatch && rgbMatch[1]) {
        const values = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length >= 3 && values[0] !== undefined && values[1] !== undefined && values[2] !== undefined) {
          return this.rgbToBrightness(values[0], values[1], values[2]);
        }
      }
      
      // Handle hsl/hsla colors
      const hslMatch = color.match(/hsla?\(([^)]+)\)/);
      if (hslMatch && hslMatch[1]) {
        const values = hslMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length >= 3 && values[0] !== undefined && values[1] !== undefined && values[2] !== undefined) {
          const [h, s, l] = values;
          const rgb = this.hslToRgb(h / 360, s / 100, l / 100);
          return this.rgbToBrightness(rgb.r, rgb.g, rgb.b);
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to calculate color brightness:', error);
      return null;
    }
  }

  /**
   * Calculate brightness using the standard luminance formula
   */
  private static rgbToBrightness(r: number, g: number, b: number): number {
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  /**
   * Convert HSL to RGB
   */
  private static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Apply theme class to document body and update CSS custom properties
   */
  static applyTheme(theme: ThemeType): void {
    try {
      // Remove existing theme classes
      document.body.classList.remove('theme-light', 'theme-dark');
      
      // Add new theme class
      document.body.classList.add(`theme-${theme}`);
      
      // Update data attribute for CSS selectors
      document.body.setAttribute('data-theme', theme);
      
      // Dispatch custom event for theme change
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme } 
      }));
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }

  /**
   * Listen for system theme changes and return cleanup function
   */
  static watchSystemTheme(callback: (theme: ThemeType) => void): () => void {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        callback(e.matches ? 'dark' : 'light');
      };
      
      // Use addEventListener if available (modern browsers)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } 
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
      
      return () => {}; // No-op cleanup
    } catch (error) {
      console.warn('Failed to watch system theme:', error);
      return () => {};
    }
  }

  /**
   * Get current theme from document classes
   */
  static getCurrentTheme(): ThemeType {
    if (document.body.classList.contains('theme-dark')) {
      return 'dark';
    } else if (document.body.classList.contains('theme-light')) {
      return 'light';
    }
    
    // Fallback to detection
    return this.detectInitialTheme();
  }

  /**
   * Check if high contrast mode is enabled
   */
  static isHighContrastMode(): boolean {
    try {
      return window.matchMedia('(prefers-contrast: high)').matches;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if reduced motion is preferred
   */
  static prefersReducedMotion(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
      return false;
    }
  }
}