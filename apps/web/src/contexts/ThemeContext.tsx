import type { PropsWithChildren } from 'react';
import { createContext, startTransition, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (nextTheme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const defaultTheme = (import.meta.env.VITE_DEFAULT_THEME as ThemeMode | undefined) ?? 'light';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: (nextTheme) => {
          startTransition(() => {
            setThemeState(nextTheme);
          });
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
