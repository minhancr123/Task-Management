import { useTheme as useThemeContext } from "@/context/ThemeContext";

export const useTheme = () => {
  return useThemeContext();
};

// Hook để kiểm tra current theme mà không cần full context
export const useCurrentTheme = () => {
  const { theme } = useThemeContext();
  
  const isDark = () => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    // System theme
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const isLight = () => !isDark();

  return {
    theme,
    isDark: isDark(),
    isLight: isLight(),
    currentTheme: isDark() ? "dark" : "light"
  };
};
