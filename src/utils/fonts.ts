// utils/fonts.ts
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";

// Primary fonts (Geist family)
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Arial", "sans-serif"],
  display: "swap",
  preload: true,
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"],
  display: "swap",
  preload: true,
});

// Fallback fonts (more reliable)
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Arial", "sans-serif"],
  display: "swap",
  preload: true,
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"],
  display: "swap",
  preload: true,
});

// Font loading with error handling
export function getFontVariables() {
  try {
    return `${geistSans.variable} ${geistMono.variable}`;
  } catch (error) {
    console.warn("Failed to load Geist fonts, falling back to Inter and JetBrains Mono:", error);
    return `${inter.variable} ${jetbrainsMono.variable}`;
  }
}
