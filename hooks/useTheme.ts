import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

let globalTheme: Theme = 'light';
const listeners = new Set<(theme: Theme) => void>();

// Initialize theme from storage (safe for browser iframe & react native environment)
if (typeof window !== 'undefined' && window.localStorage) {
  const saved = window.localStorage.getItem('daymates-theme') as Theme;
  if (saved === 'dark' || saved === 'light') {
    globalTheme = saved;
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(globalTheme);

  useEffect(() => {
    const handleThemeChange = (newTheme: Theme) => {
      setThemeState(newTheme);
    };

    listeners.add(handleThemeChange);
    setThemeState(globalTheme);

    return () => {
      listeners.delete(handleThemeChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    if (newTheme === globalTheme) return;
    globalTheme = newTheme;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('daymates-theme', newTheme);
    }
    listeners.forEach((listener) => listener(newTheme));
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  return { theme, isDark, setTheme, toggleTheme };
}
