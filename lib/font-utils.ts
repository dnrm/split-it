// Font utility functions for easy font switching during development

import { 
  primaryFont, 
  interFont, 
  poppinsFont, 
  robotoFont
} from './fonts';

export const availableFonts = {
  'Plus Jakarta Sans': primaryFont,
  'Inter': interFont,
  'Poppins': poppinsFont,
  'Roboto': robotoFont,
} as const;

export type FontName = keyof typeof availableFonts;

/**
 * Get font configuration by name
 * Useful for dynamic font switching or font selection components
 */
export function getFontByName(fontName: FontName) {
  return availableFonts[fontName];
}

/**
 * Get all available font names
 * Useful for building font selection UI
 */
export function getAvailableFontNames(): FontName[] {
  return Object.keys(availableFonts) as FontName[];
}

/**
 * Get font CSS variable name
 * Useful for applying fonts dynamically
 */
export function getFontVariable(fontName: FontName): string {
  const font = getFontByName(fontName);
  return font.variable;
}

/**
 * Generate font class names for a specific font
 * Useful for conditional font application
 */
export function getFontClasses(fontName: FontName): string {
  const font = getFontByName(fontName);
  return `${font.variable} font-sans`;
}
