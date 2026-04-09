'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectThemeMode } from '@groceryone/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useAppSelector(selectThemeMode);

  useEffect(() => {
    const root = document.documentElement;

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystemTheme = () => {
        root.classList.toggle('dark', mediaQuery.matches);
      };
      applySystemTheme();
      mediaQuery.addEventListener('change', applySystemTheme);
      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    }

    root.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  return <>{children}</>;
}
