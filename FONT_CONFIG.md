# Font Configuration Guide

This project uses a centralized font configuration system that makes it easy to change the global app font.

## How to Change the Global Font

### Quick Change
1. Open `lib/fonts.ts`
2. Find the line: `export const appFont = primaryFont;`
3. Change it to one of the available alternatives:

```typescript
// Current (Plus Jakarta Sans)
export const appFont = primaryFont;

// To use Inter instead:
export const appFont = interFont;

// To use Poppins instead:
export const appFont = poppinsFont;

// To use Roboto instead:
export const appFont = robotoFont;
```

### Adding a New Font

1. Import the font from `next/font/google` in `lib/fonts.ts`:
```typescript
import { Your_Font_Name } from "next/font/google";
```

2. Create a font configuration:
```typescript
export const yourFont = Your_Font_Name({
  variable: "--font-your-font",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Add desired weights
});
```

3. Change the appFont export:
```typescript
export const appFont = yourFont;
```

## Available Fonts

- **Plus Jakarta Sans** (current) - Modern, clean sans-serif
- **Inter** - Highly readable, designed for UI
- **Poppins** - Geometric, friendly sans-serif
- **Roboto** - Google's Material Design font

## Font Weights

All fonts are configured with multiple weights (200-800) for flexibility in design.

## How It Works

1. Fonts are imported and configured in `lib/fonts.ts`
2. The selected font is applied via CSS variables in `app/globals.css`
3. The font is applied to the body in `app/layout.tsx`
4. Tailwind's `font-sans` class uses the configured font

## Testing Font Changes

After changing the font, restart your development server to see the changes:

```bash
npm run dev
# or
yarn dev
```
