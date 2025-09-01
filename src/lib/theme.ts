import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'red' | 'yellow' | 'green' | 'blue' | 'white';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  // Remove all existing theme classes
  root.classList.remove('theme-yellow', 'theme-green', 'theme-blue', 'theme-white');
  
  // Apply new theme class (red is default, no class needed)
  if (theme !== 'red') {
    root.classList.add(`theme-${theme}`);
  }
};

export const useThemeState = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('red');

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem('netwatch-theme', theme);
  };

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('netwatch-theme') as Theme;
    if (savedTheme && ['red', 'yellow', 'green', 'blue', 'white'].includes(savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  return { currentTheme, setTheme };
};