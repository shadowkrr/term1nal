import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeContext, useThemeState } from './lib/theme';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeState = useThemeState();
  
  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);