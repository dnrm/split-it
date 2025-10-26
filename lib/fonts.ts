import { Plus_Jakarta_Sans, Geist, Geist_Mono, Inter, Poppins, Roboto } from "next/font/google";

// Font configuration - easily change the primary font here
export const primaryFont = Plus_Jakarta_Sans({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

// Alternative fonts you can easily switch to:
export const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const poppinsFont = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const robotoFont = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

// Monospace font
export const monoFont = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// To change the global font, simply replace primaryFont with one of the alternatives above
// Example: export const appFont = interFont; // for Inter font
// Example: export const appFont = poppinsFont; // for Poppins font
export const appFont = primaryFont; // Currently using Plus Jakarta Sans
