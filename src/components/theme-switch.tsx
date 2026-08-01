'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import styles from './theme-switch.module.css';

type Theme = 'light' | 'dark';

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

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
  const [isSwitching, setIsSwitching] = React.useState(false);
  const transitionTimerRef = React.useRef<number | null>(null);
  const transitionSequenceRef = React.useRef(0);

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
    transitionSequenceRef.current += 1;
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

    setIsSwitching(true);
    root.dataset.themeTransition = 'true';
    const transitionId = ++transitionSequenceRef.current;
    const finishTransition = () => {
      if (transitionSequenceRef.current !== transitionId) return;
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      root.removeAttribute('data-theme-transition');
      setIsSwitching(false);
    };
    const viewTransitionDocument = document as ViewTransitionDocument;

    if (typeof viewTransitionDocument.startViewTransition === 'function') {
      try {
        const viewTransition = viewTransitionDocument.startViewTransition(() => applyTheme(nextTheme));
        void viewTransition.finished.then(finishTransition, finishTransition);
        transitionTimerRef.current = window.setTimeout(finishTransition, 360);
        return;
      } catch {
        // A rapid second click can overlap a native transition; use the light fallback.
      }
    }

    applyTheme(nextTheme);
    transitionTimerRef.current = window.setTimeout(finishTransition, 220);
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
    <div className={styles.themeSwitch} data-theme={theme} data-switching={isSwitching || undefined}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        className={styles.control}
        onClick={toggleTheme}
      >
        <span aria-hidden="true" className={styles.iconStage}>
          <Sun className={styles.sun} strokeWidth={1.8} />
          <Moon className={styles.moon} strokeWidth={1.8} />
        </span>
      </button>
    </div>
  );
}
