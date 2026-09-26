// SPDX-License-Identifier: GPL-3.0-or-later
const THEME_KEY = 'nms-handbook:theme';

type Theme = 'light' | 'dark';

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme | null): void {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

const initial = readStored();
applyTheme(initial);
let themeState = $state<Theme | null>(initial);

export const theme = {
  get current(): Theme | null {
    return themeState;
  },
};

export function toggleTheme(): void {
  const current =
    themeState ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  themeState = next;
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* storage unavailable */
  }
}
