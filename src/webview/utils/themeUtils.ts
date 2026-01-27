import { ThemeType } from '../types';

/**
 * Utility functions for VS Code theme detection and management
 */
export class ThemeUtils {
  /**
   * Detect initial theme from VS Code CSS variables and DOM classes
   * This provides immediate theme detection before extension communication
   */
  static detectInitialTheme(): ThemeType {
    try {
      // Check VS Code CSS variables to determine theme
      const backgroundColor = getComputedStyle(document.body).getPropertyValue('--vscode-editor-background');
      
      // If we can't get the colors, check for dark theme class on body
      if (document.body.classList.contains('vscode-dark')) {
        return 'dark';
      } else if (document.body.classList.contains('vscode-light')) {
        return 'light';
      }
      
      // Fallback: analyze background color brightness
      if (backgroundColor) {
        // Convert hex/rgb to brightness value
        const rgb = backgroundColor.match(/\d+/g);
        if (rgb && rgb.length >= 3 && rgb[0] && rgb[1] && rgb[2]) {
          const r = parseInt(rgb[0], 10);
          const g = parseInt(rgb[1], 10);
          const b = parseInt(rgb[2], 10);
          
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness < 128 ? 'dark' : 'light';
          }
        }
      }
      
      // Final fallback
      return 'light';
    } catch (error) {
      console.warn('Failed to detect initial theme:', error);
      return 'light';
    }
  }
}