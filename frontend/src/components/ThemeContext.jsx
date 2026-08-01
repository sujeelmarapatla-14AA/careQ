import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Always force clean, bright light mode
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('careq_theme', 'light');
    localStorage.setItem('careq-theme', 'light');
    
    const metaThemeColor = document.getElementById('theme-color-meta');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#FFFFFF');
    }
  }, []);

  const toggleTheme = () => {
    // Permanent light mode - no operation
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
