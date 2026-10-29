import { useCallback, useEffect, useState } from 'react';

const KEY = 'aether.theme.v1';
const META_COLORS = { day: '#eef2f7', night: '#0b1020' };

/** First visit follows the clock (day 06:00–18:00); after that the player's choice sticks. */
function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'day' || saved === 'night') return saved;
  } catch {
    /* storage unavailable */
  }
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[theme]);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'day' ? 'night' : 'day';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
