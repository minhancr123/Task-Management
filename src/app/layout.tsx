import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../ context/AuthContext";
import { ThemeProvider } from "../ context/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Management System",
  description: "A modern task management application built with Next.js and Supabase",
  icons: {
    icon: "/next.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedSettings = localStorage.getItem('userSettings');
                  let theme = 'system';
                  
                  if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    theme = settings.theme || 'system';
                  }
                  
                  const root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'light') {
                    root.classList.add('light');
                  } else {
                    // System theme
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      root.classList.add('dark');
                    } else {
                      root.classList.add('light');
                    }
                  }
                } catch (e) {
                  // Fallback to system theme
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
              {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
