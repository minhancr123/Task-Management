"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [isLoading, setIsLoading] = useState(true);

  // Function to apply theme to DOM
  const applyTheme = (themeToApply: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    if (themeToApply === "dark") {
      root.classList.add("dark");
    } else if (themeToApply === "light") {
      // Add light class explicitly for consistency
      root.classList.add("light");
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
  };

  useEffect(() => {
    // Load theme from localStorage on mount and apply immediately
    const savedSettings = localStorage.getItem('userSettings');
    let initialTheme: Theme = "system";
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.theme) {
          initialTheme = settings.theme;
        }
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }
    
    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Apply theme whenever it changes
    if (!isLoading) {
      applyTheme(theme);
    }
  }, [theme, isLoading]);

  useEffect(() => {
    // Listen for system theme changes when using system theme
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = () => {
        applyTheme("system");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Update localStorage
    const savedSettings = localStorage.getItem('userSettings');
    let settings = {};
    
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }
    
    const updatedSettings = {
      ...settings,
      theme: newTheme,
    };
    
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
