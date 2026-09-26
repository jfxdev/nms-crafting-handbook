<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Store } from '../lib/data.ts';
  import { fmt, loc, RECIPE_LABEL, t } from '../lib/i18n.svelte.ts';
  import type { Recipe } from '../lib/types.ts';
  import Badge from './Badge.svelte';
  import Card from './Card.svelte';
  import IngredientChip from './IngredientChip.svelte';

  let {
    store,
    recipe: r,
    current,
    wanted,
    showOutput = true,
  }: {
    store: Store;
    recipe: Recipe;
    current: string;
    wanted?: number;
    showOutput?: boolean;
  } = $props();

  const BORDER_VAR = { craft: '--craft', refine: '--refine', cook: '--cook' } as const;

  const out = $derived(store.items.get(r.output.id));
  const outName = $derived(out ? loc(out.name) : r.output.id);
  const runs = $derived(wanted ? Math.ceil(wanted / r.output.qty) : 1);
  const meta = $derived(
    [r.op ? loc(r.op) : '', r.time !== undefined ? `${t('time')}: ${fmt(r.time)} s` : ''].filter(
      Boolean,
    ),
  );
  const perUnitText = $derived(
    r.perUnit
      .map((p) => {
        const item = store.items.get(p.id);
        return `${fmt(p.qty)}× ${item ? loc(item.name) : p.id}`;
      })
      .join(' + '),
  );
</script>

<Card
  as="article"
  class="border-l-4 p-2.5 sm:p-3"
  style="border-left-color: var({BORDER_VAR[r.type]})"
>
  <header class="mb-2 flex flex-wrap items-center gap-2">
    <Badge tone={r.type} label={loc(RECIPE_LABEL[r.type])} />
    {#if r.source === 'override'}
      <Badge tone="manual" label={t('manual')} />
    {/if}
    {#if meta.length}
      <span class="text-muted text-[0.85rem]">{meta.join(' · ')}</span>
    {/if}
  </header>

  <div class="flex flex-wrap items-center gap-2">
    <div class="flex flex-wrap gap-1.5">
      {#each r.inputs as i (i.id)}
        <IngredientChip
          item={store.items.get(i.id)}
          name={store.items.get(i.id) ? loc(store.items.get(i.id)!.name) : i.id}
          qty={i.qty * runs}
          current={i.id === current}
        />
      {/each}
    </div>
    {#if showOutput}
      <span class="text-muted text-lg" aria-hidden="true">→</span>
      <IngredientChip
        item={out}
        name={outName}
        qty={r.output.qty * runs}
        current={r.output.id === current}
        highlight
      />
    {/if}
  </div>

  <footer class="border-border mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed pt-2 text-[0.85rem]">
    <span title={t('ratio')}
      ><strong class="text-muted mr-1 font-semibold">{t('ratio')}</strong>{r.ratio.replace(
        ':',
        ' : ',
      )}</span
    >
    <span>{perUnitText} <span class="text-muted">{t('perUnit', { item: outName })}</span></span>
    {#if wanted && wanted > 1}
      <span class="text-muted">{t('forQty', { n: fmt(wanted) })} {t('runs', { n: runs })}</span>
    {/if}
  </footer>
</Card>
