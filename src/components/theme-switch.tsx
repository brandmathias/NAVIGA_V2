'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import styles from './theme-switch.module.css';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'naviga-theme';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeSwitch() {
  const [theme, setTheme] = React.useState<Theme>('light');
  const transitionTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const nextTheme: Theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : getSystemTheme();
      setTheme(nextTheme);
      applyTheme(nextTheme);
    } catch {
      const nextTheme = getSystemTheme();
      setTheme(nextTheme);
      applyTheme(nextTheme);
    }
  }, []);

  React.useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    document.documentElement.removeAttribute('data-theme-transition');
  }, []);

  const applyThemeWithTransition = (nextTheme: Theme) => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme(nextTheme);
      return;
    }

    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);

    root.dataset.themeTransition = 'true';
    applyTheme(nextTheme);
    transitionTimerRef.current = window.setTimeout(() => root.removeAttribute('data-theme-transition'), 460);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyThemeWithTransition(nextTheme);

    try {
      window.localStorage.setItem('naviga-theme', nextTheme);
    } catch {
      // The visual preference still works when browser storage is unavailable.
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={styles.themeSwitch} data-theme={theme}>
      <Sun aria-hidden="true" className={styles.sun} strokeWidth={1.8} />
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        className={styles.control}
        onClick={toggleTheme}
      >
        <span className={styles.thumb}>
          <Sun aria-hidden="true" className={styles.thumbSun} strokeWidth={2} />
          <Moon aria-hidden="true" className={styles.thumbMoon} strokeWidth={2} />
        </span>
      </button>
      <Moon aria-hidden="true" className={styles.moon} strokeWidth={1.8} />
    </div>
  );
}
