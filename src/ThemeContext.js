import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      // Light mode colors
      light: {
        primary: '#667eea',
        primaryLight: '#8b9bff',
        primaryDark: '#4c63d2',
        secondary: '#764ba2',
        background: '#ffffff',
        backgroundSecondary: '#f8f9ff',
        backgroundTertiary: '#f0f2f5',
        surface: '#ffffff',
        surfaceSecondary: '#f8f9fa',
        text: '#333333',
        textSecondary: '#65676b',
        textMuted: '#666666',
        border: 'rgba(0, 0, 0, 0.06)',
        borderLight: 'rgba(0, 0, 0, 0.05)',
        shadow: 'rgba(0, 0, 0, 0.08)',
        accent: '#42b883',
        accentSecondary: '#ff6b6b',
        warning: '#ffd93d',
        success: '#6bcf7f'
      },
      // Dark mode colors (midnight blue theme)
      dark: {
        primary: '#7c8cff',
        primaryLight: '#a5b3ff',
        primaryDark: '#5c6ceb',
        secondary: '#9575cd',
        background: '#0f1419',
        backgroundSecondary: '#1a1f2e',
        backgroundTertiary: '#243b53',
        surface: '#1e2832',
        surfaceSecondary: '#2a3441',
        text: '#e8eaed',
        textSecondary: '#bdc1c6',
        textMuted: '#9aa0a6',
        border: 'rgba(255, 255, 255, 0.12)',
        borderLight: 'rgba(255, 255, 255, 0.08)',
        shadow: 'rgba(0, 0, 0, 0.3)',
        accent: '#4db6ac',
        accentSecondary: '#ff7043',
        warning: '#ffb74d',
        success: '#81c784'
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};