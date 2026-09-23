// SPDX-License-Identifier: GPL-3.0-or-later
import { iconUrl, type Store } from '../data.ts';
import { escapeHtml } from '../gametext.ts';
import { CATEGORY_LABEL, lang, loc, other, RECIPE_LABEL, t } from '../i18n.ts';
import { itemHref, searchHref } from '../router.ts';
import type { ItemIndex } from '../search.ts';
import type { Item, RecipeType } from '../types.ts';

const LIMIT = 120;
const FILTERS = ['all', 'craft', 'refine', 'cook', 'none'] as const;
type Filter = (typeof FILTERS)[number];

const filterLabel = (f: Filter): string =>
  f === 'all' ? t('all') : f === 'none' ? t('noRecipe') : loc(RECIPE_LABEL[f]);

export function obtainBadges(item: Item): string {
  if (!item.obtain.length) return `<span class="badge badge-none">${t('noRecipe')}</span>`;
  return item.obtain
    .map((o: RecipeType) => `<span class="badge badge-${o}">${loc(RECIPE_LABEL[o])}</span>`)
    .join('');
}

export function itemCard(item: Item): string {
  const alt = other(item.name);
  return `<a class="card item-card" href="${itemHref(item.id)}">
    <img class="icon" src="${iconUrl(item)}" alt="" loading="lazy" width="48" height="48">
    <span class="item-card-text">
      <span class="item-name">${escapeHtml(loc(item.name))}</span>
      ${alt && alt !== loc(item.name) ? `<span class="item-alt">${escapeHtml(alt)}</span>` : ''}
      <span class="item-group">${escapeHtml(loc(item.group))}</span>
      <span class="badges">${obtainBadges(item)}</span>
    </span>
  </a>`;
}

export function renderSearch(
  root: HTMLElement,
  store: Store,
  index: ItemIndex,
  params: URLSearchParams,
): void {
  const q = params.get('q')?.trim() ?? '';
  const f = (FILTERS as readonly string[]).includes(params.get('f') ?? '')
    ? (params.get('f') as Filter)
    : 'all';
  const c = params.get('c') ?? '';

  let items: Item[] = q
    ? index.search(q).map((id) => store.items.get(id)!)
    : [...store.items.values()].sort((a, b) => loc(a.name).localeCompare(loc(b.name), lang));
  items = items.filter(
    (i) =>
      (!c || i.cat === c) &&
      (f === 'all' || (f === 'none' ? i.obtain.length === 0 : i.obtain.includes(f))),
  );

  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k);
    return searchHref(p);
  };

  root.innerHTML = `
    <section class="filters" aria-label="Filters">
      <div class="chips" role="group">
        ${FILTERS.map(
          (x) =>
            `<a class="chip ${x === f ? 'active' : ''}" href="${link({ f: x === 'all' ? '' : x })}"
              ${x === f ? 'aria-current="true"' : ''}>${filterLabel(x)}</a>`,
        ).join('')}
      </div>
      <select id="category" aria-label="${t('allCategories')}">
        <option value="">${t('allCategories')}</option>
        ${store.catalog.categories
          .map(
            (cat) =>
              `<option value="${cat}" ${cat === c ? 'selected' : ''}>${escapeHtml(
                CATEGORY_LABEL[cat] ? loc(CATEGORY_LABEL[cat]) : cat,
              )}</option>`,
          )
          .join('')}
      </select>
    </section>
    <p class="muted count">${
      items.length
        ? t('showing', { n: Math.min(items.length, LIMIT), total: items.length })
        : t('noResults')
    }</p>
    <section class="grid">${items.slice(0, LIMIT).map(itemCard).join('')}</section>`;

  root.querySelector<HTMLSelectElement>('#category')!.addEventListener('change', (e) => {
    location.hash = link({ c: (e.target as HTMLSelectElement).value });
  });
}
