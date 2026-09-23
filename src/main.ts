// SPDX-License-Identifier: GPL-3.0-or-later
import './styles.css';
import { loadStore, type Store } from './data.ts';
import { lang, setLang, t } from './i18n.ts';
import { parseRoute, replaceHash, searchHref } from './router.ts';
import { createIndex, type ItemIndex } from './search.ts';
import type { Lang } from './types.ts';
import { renderItem } from './views/ItemView.ts';
import { renderSearch } from './views/SearchView.ts';

const app = document.getElementById('app')!;
const q = document.getElementById('q') as HTMLInputElement;
const THEME_KEY = 'nms-handbook:theme';

function applyTheme(theme: string | null): void {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function initTheme(): void {
  try {
    applyTheme(localStorage.getItem(THEME_KEY));
  } catch {
    /* storage unavailable */
  }
  document.getElementById('theme')!.addEventListener('click', () => {
    const current =
      document.documentElement.dataset.theme ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable */
    }
  });
}

function renderChrome(store: Store): void {
  const s = store.catalog.source;
  document.title = t('title');
  q.placeholder = t('searchPlaceholder');
  q.setAttribute('aria-label', t('searchPlaceholder'));
  document.getElementById('theme')!.setAttribute('aria-label', t('theme'));
  document
    .querySelectorAll<HTMLButtonElement>('[data-lang]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  const date = new Date(s.commitDate).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US');
  const source = document.getElementById('source')!;
  source.textContent = t('dataVersion', { v: s.gameVersion, name: s.gameVersionName });
  if (s.stale) {
    const warn = document.createElement('span');
    warn.className = 'stale';
    warn.textContent = ` — ${t('staleWarning', { date, name: s.gameVersionName })}`;
    source.append(warn);
  }
  document.getElementById('footer')!.textContent =
    `${t('footer')} Source: AssistantNMS@${s.sha.slice(0, 7)}.`;
}

let lastPath = '';

function render(store: Store, index: ItemIndex): void {
  const route = parseRoute();
  const path = route.name === 'item' ? `item/${route.id}` : 'search';
  if (route.name === 'search') {
    const query = route.params.get('q') ?? '';
    if (document.activeElement !== q) q.value = query;
    renderSearch(app, store, index, route.params);
  } else {
    void renderItem(app, store, route.id, route.params);
  }
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
}

async function main(): Promise<void> {
  setLang(lang);
  initTheme();
  const store = await loadStore();
  const index = createIndex(store.catalog.items);
  renderChrome(store);

  q.addEventListener('input', () => {
    const route = parseRoute();
    const params =
      route.name === 'search' ? new URLSearchParams(route.params) : new URLSearchParams();
    if (q.value.trim()) params.set('q', q.value);
    else params.delete('q');
    replaceHash(searchHref(params));
    render(store, index);
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') app.querySelector<HTMLAnchorElement>('.item-card')?.focus();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => {
      setLang(b.dataset.lang as Lang);
      renderChrome(store);
      render(store, index);
    }),
  );
  window.addEventListener('hashchange', () => render(store, index));
  render(store, index);
}

main().catch((err: unknown) => {
  app.textContent = `Failed to load the catalog: ${String(err)}`;
});
