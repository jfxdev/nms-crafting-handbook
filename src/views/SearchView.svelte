<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import Chip from '../components/Chip.svelte';
  import CategorySelect from '../components/CategorySelect.svelte';
  import ItemCard from '../components/ItemCard.svelte';
  import Muted from '../components/Muted.svelte';
  import type { Store } from '../lib/data.ts';
  import { lang, loc, RECIPE_LABEL, t } from '../lib/i18n.svelte.ts';
  import { router, searchHref } from '../lib/router.svelte.ts';
  import type { ItemIndex } from '../lib/search.ts';
  import type { Item, RecipeType } from '../lib/types.ts';

  let { store, index }: { store: Store; index: ItemIndex } = $props();

  const LIMIT = 120;
  const FILTERS = ['all', 'craft', 'refine', 'cook', 'none'] as const;
  type Filter = (typeof FILTERS)[number];

  const params = $derived(router.route.params);
  const q = $derived(params.get('q')?.trim() ?? '');
  const f = $derived(
    (FILTERS as readonly string[]).includes(params.get('f') ?? '')
      ? (params.get('f') as Filter)
      : 'all',
  );
  const c = $derived(params.get('c') ?? '');

  const filterLabel = (x: Filter) =>
    x === 'all' ? t('all') : x === 'none' ? t('noRecipe') : loc(RECIPE_LABEL[x as RecipeType]);

  const items = $derived.by(() => {
    let list: Item[] = q
      ? index.search(q).map((id) => store.items.get(id)!)
      : [...store.items.values()].sort((a, b) => loc(a.name).localeCompare(loc(b.name), lang.current));
    return list.filter(
      (i) =>
        (!c || i.cat === c) &&
        (f === 'all' || (f === 'none' ? i.obtain.length === 0 : i.obtain.includes(f))),
    );
  });

  function link(patch: Record<string, string>): string {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    return searchHref(p);
  }

  function setCategory(v: string): void {
    location.hash = link({ c: v });
  }
</script>

<section class="flex flex-wrap items-center justify-between gap-2" aria-label="Filters">
  <div class="flex flex-wrap gap-1.5" role="group">
    {#each FILTERS as x (x)}
      <Chip href={link({ f: x === 'all' ? '' : x })} active={x === f}>{filterLabel(x)}</Chip>
    {/each}
  </div>
  <CategorySelect categories={store.catalog.categories} value={c} onChange={setCategory} />
</section>

<p class="my-3">
  <Muted>
    {items.length ? t('showing', { n: Math.min(items.length, LIMIT), total: items.length }) : t('noResults')}
  </Muted>
</p>

<section class="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {#each items.slice(0, LIMIT) as item (item.id)}
    <ItemCard {item} />
  {/each}
</section>
