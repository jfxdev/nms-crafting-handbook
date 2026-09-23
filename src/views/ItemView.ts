// SPDX-License-Identifier: GPL-3.0-or-later
import { iconUrl, type Store } from '../data.ts';
import { escapeHtml, gameTextToHtml, markdownToHtml } from '../gametext.ts';
import { CATEGORY_LABEL, fmt, lang, loc, other, RECIPE_LABEL, t } from '../i18n.ts';
import { itemHref, replaceHash } from '../router.ts';
import type { Item, Qty, Recipe, RecipeType } from '../types.ts';
import { obtainBadges } from './SearchView.ts';

const USED_IN_PREVIEW = 12;
const TYPES: RecipeType[] = ['craft', 'refine', 'cook'];

function chip(store: Store, q: Qty, current: string, qty = q.qty): string {
  const item = store.items.get(q.id);
  const name = item ? loc(item.name) : q.id;
  const inner = `<img class="icon icon-sm" src="${iconUrl(item)}" alt="" loading="lazy" width="28" height="28">
    <span class="qty">${fmt(qty)}×</span><span>${escapeHtml(name)}</span>`;
  return q.id === current
    ? `<span class="ing ing-current">${inner}</span>`
    : `<a class="ing" href="${itemHref(q.id)}">${inner}</a>`;
}

/**
 * One recipe. When `wanted` is given (the "Made from" section), quantities are scaled to whole
 * machine runs / crafts needed to produce `wanted` units of the output.
 */
function recipeCard(store: Store, r: Recipe, current: string, wanted?: number): string {
  const out = store.items.get(r.output.id);
  const outName = out ? loc(out.name) : r.output.id;
  const runs = wanted ? Math.ceil(wanted / r.output.qty) : 1;
  const meta = [
    r.op ? escapeHtml(loc(r.op)) : '',
    r.time !== undefined ? `${t('time')}: ${fmt(r.time)} s` : '',
  ].filter(Boolean);
  const perUnit = r.perUnit
    .map((p) => {
      const name = store.items.get(p.id);
      return `${fmt(p.qty)}× ${escapeHtml(name ? loc(name.name) : p.id)}`;
    })
    .join(' + ');

  return `<article class="card recipe recipe-${r.type}">
    <header class="recipe-head">
      <span class="badge badge-${r.type}">${loc(RECIPE_LABEL[r.type])}</span>
      ${r.source === 'override' ? `<span class="badge badge-manual">${t('manual')}</span>` : ''}
      ${meta.length ? `<span class="muted small">${meta.join(' · ')}</span>` : ''}
    </header>
    <div class="recipe-flow">
      <div class="ings">${r.inputs.map((i) => chip(store, i, current, i.qty * runs)).join('')}</div>
      <span class="arrow" aria-hidden="true">→</span>
      <div class="ings">${chip(store, r.output, current, r.output.qty * runs)}</div>
    </div>
    <footer class="io">
      <span class="ratio" title="${t('ratio')}"><strong>${t('ratio')}</strong> ${r.ratio.replace(':', ' : ')}</span>
      <span class="per-unit">${perUnit} <span class="muted">${t('perUnit', { item: escapeHtml(outName) })}</span></span>
      ${wanted && wanted > 1 ? `<span class="muted small">${t('forQty', { n: fmt(wanted) })} ${t('runs', { n: runs })}</span>` : ''}
    </footer>
  </article>`;
}

function grouped(store: Store, ids: string[]): Map<RecipeType, Recipe[]> {
  const groups = new Map<RecipeType, Recipe[]>();
  for (const type of TYPES) groups.set(type, []);
  for (const id of ids) {
    const r = store.recipes.get(id);
    if (r) groups.get(r.type)!.push(r);
  }
  return groups;
}

export async function renderItem(
  root: HTMLElement,
  store: Store,
  id: string,
  params: URLSearchParams,
): Promise<void> {
  const item: Item | undefined = store.items.get(id);
  if (!item) {
    root.innerHTML = `<p><a href="#/">${t('back')}</a></p><p>${t('notFound')}</p>`;
    return;
  }
  const wanted = Math.max(1, Math.floor(Number(params.get('n')) || 1));
  const produced = store.catalog.producedBy[id] ?? [];
  const used = store.catalog.usedIn[id] ?? [];
  const alt = other(item.name);
  const expanded = new Set((params.get('all') ?? '').split(',').filter(Boolean));

  const usedGroups = [...grouped(store, used)]
    .filter(([, rs]) => rs.length)
    .map(([type, rs]) => {
      rs.sort((a, b) => {
        const an = store.items.get(a.output.id),
          bn = store.items.get(b.output.id);
        return (an ? loc(an.name) : '').localeCompare(bn ? loc(bn.name) : '', lang);
      });
      const shown = expanded.has(type) ? rs : rs.slice(0, USED_IN_PREVIEW);
      return `<h3>${loc(RECIPE_LABEL[type])} <span class="muted">(${rs.length})</span></h3>
        <div class="recipes">${shown.map((r) => recipeCard(store, r, id)).join('')}</div>
        ${shown.length < rs.length ? `<button class="more" data-type="${type}">${t('showAll', { n: rs.length })}</button>` : ''}`;
    })
    .join('');

  root.innerHTML = `
    <p><a href="#/" class="back">${t('back')}</a></p>
    <header class="item-head">
      <img class="icon icon-lg" src="${iconUrl(item)}" alt="" width="96" height="96"
        style="${item.colour ? `--item-colour:#${item.colour}` : ''}">
      <div>
        <h1>${escapeHtml(loc(item.name))}</h1>
        ${alt && alt !== loc(item.name) ? `<p class="item-alt">${escapeHtml(alt)}</p>` : ''}
        <p class="muted">${escapeHtml(loc(item.group))} · ${escapeHtml(
          CATEGORY_LABEL[item.cat] ? loc(CATEGORY_LABEL[item.cat]!) : item.cat,
        )} · <code>${escapeHtml(item.id)}</code></p>
        <p class="badges">${obtainBadges(item)}${item.manual ? `<span class="badge badge-manual">${t('manual')}</span>` : ''}</p>
        <dl class="stats">
          <div><dt>${t('value')}</dt><dd>${fmt(item.value)} ${escapeHtml(item.currency)}</dd></div>
          ${item.stack ? `<div><dt>${t('stack')}</dt><dd>${fmt(item.stack)}</dd></div>` : ''}
        </dl>
      </div>
    </header>

    ${
      produced.length
        ? `<section>
        <div class="section-head">
          <h2>${t('madeFrom')}</h2>
          <label class="qty-input">${t('desiredQty')}
            <input id="wanted" type="number" min="1" step="1" value="${wanted}" inputmode="numeric">
          </label>
        </div>
        <div class="recipes" id="made-from">${produced
          .map((rid) => store.recipes.get(rid))
          .filter((r): r is Recipe => !!r)
          .map((r) => recipeCard(store, r, id, wanted))
          .join('')}</div>
        <details class="desc"><summary>${t('description')}</summary><div id="desc"></div></details>
      </section>`
        : `<section><h2>${t('howToGet')}</h2><div class="card prose" id="desc"></div></section>`
    }

    <section>
      <h2>${t('usedIn')} <span class="muted">(${used.length})</span></h2>
      ${usedGroups || `<p class="muted">${t('notUsed')}</p>`}
    </section>`;

  const input = root.querySelector<HTMLInputElement>('#wanted');
  input?.addEventListener('input', () => {
    const n = Math.max(1, Math.floor(Number(input.value) || 1));
    const p = new URLSearchParams(params);
    if (n > 1) p.set('n', String(n));
    else p.delete('n');
    const q = p.toString();
    replaceHash(`${itemHref(id)}${q ? `?${q}` : ''}`);
    const recipes = root.querySelector('#made-from')!;
    recipes.innerHTML = produced
      .map((rid) => store.recipes.get(rid))
      .filter((r): r is Recipe => !!r)
      .map((r) => recipeCard(store, r, id, n))
      .join('');
  });
  root.querySelectorAll<HTMLButtonElement>('button.more').forEach((b) =>
    b.addEventListener('click', () => {
      const p = new URLSearchParams(params);
      p.set('all', [...expanded, b.dataset.type!].join(','));
      location.hash = `${itemHref(id)}?${p}`;
    }),
  );

  const desc = await store.description(item);
  const target = root.querySelector<HTMLElement>('#desc');
  if (!target) return;
  const text = desc?.text ? loc(desc.text) : '';
  const notes = desc?.notes?.[lang] ?? desc?.notes?.en;
  target.innerHTML =
    [
      text ? gameTextToHtml(text) : '',
      notes ? `<div class="notes">${markdownToHtml(notes)}</div>` : '',
    ]
      .filter(Boolean)
      .join('') || `<p class="muted">${t('noDescription')}</p>`;
}
