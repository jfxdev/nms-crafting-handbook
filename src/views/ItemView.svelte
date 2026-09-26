<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import Badge from '../components/Badge.svelte';
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import ColourBadge from '../components/ColourBadge.svelte';
  import Heading from '../components/Heading.svelte';
  import Icon from '../components/Icon.svelte';
  import Muted from '../components/Muted.svelte';
  import ObtainBadges from '../components/ObtainBadges.svelte';
  import RecipeCard from '../components/RecipeCard.svelte';
  import Section from '../components/Section.svelte';
  import type { Store } from '../lib/data.ts';
  import { CATEGORY_LABEL, fmt, lang, loc, other, RECIPE_LABEL, t } from '../lib/i18n.svelte.ts';
  import { gameTextToHtml, markdownToHtml } from '../lib/gametext.ts';
  import { itemHref, replaceHash, router } from '../lib/router.svelte.ts';
  import type { Recipe, RecipeType } from '../lib/types.ts';

  let { store, id }: { store: Store; id: string } = $props();

  const USED_IN_PREVIEW = 12;
  const TYPES: RecipeType[] = ['craft', 'refine', 'cook'];

  const item = $derived(store.items.get(id));
  const produced = $derived(store.catalog.producedBy[id] ?? []);
  const used = $derived(store.catalog.usedIn[id] ?? []);
  const alt = $derived(item ? other(item.name) : '');
  const params = $derived(router.route.params);
  const expanded = $derived(new Set((params.get('all') ?? '').split(',').filter(Boolean)));

  let wanted = $state(1);
  $effect(() => {
    id;
    wanted = Math.max(1, Math.floor(Number(router.route.params.get('n')) || 1));
  });

  function onWantedInput(v: string): void {
    wanted = Math.max(1, Math.floor(Number(v) || 1));
    const p = new URLSearchParams(router.route.params);
    if (wanted > 1) p.set('n', String(wanted));
    else p.delete('n');
    const qs = p.toString();
    replaceHash(`${itemHref(id)}${qs ? `?${qs}` : ''}`);
    router.sync();
  }

  function showAll(type: RecipeType): void {
    const p = new URLSearchParams(params);
    p.set('all', [...expanded, type].join(','));
    location.hash = `${itemHref(id)}?${p}`;
  }

  function grouped(ids: string[]): Map<RecipeType, Recipe[]> {
    const groups = new Map<RecipeType, Recipe[]>();
    for (const type of TYPES) groups.set(type, []);
    for (const rid of ids) {
      const r = store.recipes.get(rid);
      if (r) groups.get(r.type)!.push(r);
    }
    return groups;
  }

  const usedGroups = $derived(
    [...grouped(used)]
      .filter(([, rs]) => rs.length)
      .map(([type, rs]) => {
        const sorted = [...rs].sort((a, b) => {
          const an = store.items.get(a.output.id);
          const bn = store.items.get(b.output.id);
          return (an ? loc(an.name) : '').localeCompare(bn ? loc(bn.name) : '', lang.current);
        });
        const shown = expanded.has(type) ? sorted : sorted.slice(0, USED_IN_PREVIEW);
        return { type, all: sorted, shown };
      }),
  );

  const producedRecipes = $derived(
    produced.map((rid) => store.recipes.get(rid)).filter((r): r is Recipe => !!r),
  );

  let desc = $state<Awaited<ReturnType<Store['description']>>>(undefined);
  $effect(() => {
    const current = item;
    desc = undefined;
    if (!current) return;
    store.description(current).then((d) => {
      if (item === current) desc = d;
    });
  });

  const descHtml = $derived.by(() => {
    const text = desc?.text ? loc(desc.text) : '';
    const notes = desc?.notes?.[lang.current] ?? desc?.notes?.en;
    return (
      [
        text ? gameTextToHtml(text) : '',
        notes ? `<div class="notes">${markdownToHtml(notes)}</div>` : '',
      ]
        .filter(Boolean)
        .join('') || `<p class="text-muted">${t('noDescription')}</p>`
    );
  });
</script>

{#if !item}
  <p><a href="#/" class="text-muted no-underline">{t('back')}</a></p>
  <p>{t('notFound')}</p>
{:else}
  <p><a href="#/" class="text-muted no-underline">{t('back')}</a></p>

  <header class="mb-2 flex flex-col items-start gap-4 sm:flex-row">
    <Icon {item} size="lg" class="border-2 border-[var(--item-colour,var(--border))] p-1.5" />
    <div>
      <Heading level={1} class="m-0">{loc(item.name)}</Heading>
      {#if alt && alt !== loc(item.name)}
        <p class="text-muted my-1">{alt}</p>
      {/if}
      <p class="text-muted my-1">
        {loc(item.group)} · {CATEGORY_LABEL[item.cat] ? loc(CATEGORY_LABEL[item.cat]!) : item.cat} ·
        <code>{item.id}</code>
      </p>
      <p class="mt-1 flex flex-wrap gap-1">
        <ObtainBadges obtain={item.obtain} />
        {#if item.manual}<Badge tone="manual" label={t('manual')} />{/if}
        {#if item.colour}<ColourBadge colour={item.colour} />{/if}
      </p>
      <dl class="mt-2 flex gap-4">
        <div>
          <dt class="text-muted text-xs">{t('value')}</dt>
          <dd class="m-0 font-semibold">{fmt(item.value)} {item.currency}</dd>
        </div>
        {#if item.stack}
          <div>
            <dt class="text-muted text-xs">{t('stack')}</dt>
            <dd class="m-0 font-semibold">{fmt(item.stack)}</dd>
          </div>
        {/if}
      </dl>
    </div>
  </header>

  {#if produced.length}
    <Section title={t('madeFrom')}>
      {#snippet actions()}
        <label class="text-muted inline-flex items-center gap-2 text-sm">
          {t('desiredQty')}
          <input
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            value={wanted}
            oninput={(e) => onWantedInput(e.currentTarget.value)}
            class="border-border bg-surface text-text w-[90px] rounded-lg border px-2 py-1"
          />
        </label>
      {/snippet}
      <div class="mt-2 grid gap-2.5">
        {#each producedRecipes as r (r.id)}
          <RecipeCard {store} recipe={r} current={id} {wanted} showOutput={false} />
        {/each}
      </div>
      <details class="mt-3">
        <summary class="text-muted cursor-pointer">{t('description')}</summary>
        <div class="prose px-0 py-1 sm:px-4">{@html descHtml}</div>
      </details>
    </Section>
  {:else}
    <Section title={t('howToGet')}>
      <Card class="prose px-4 py-1">{@html descHtml}</Card>
    </Section>
  {/if}

  <Section title={t('usedIn')} count={used.length}>
    {#if usedGroups.length}
      {#each usedGroups as g (g.type)}
        <h3 class="mb-2 mt-4 text-base">
          {loc(RECIPE_LABEL[g.type])} <span class="text-muted font-normal">({g.all.length})</span>
        </h3>
        <div class="grid gap-2.5">
          {#each g.shown as r (r.id)}
            <RecipeCard {store} recipe={r} current={id} />
          {/each}
        </div>
        {#if g.shown.length < g.all.length}
          <div class="mt-2">
            <Button onclick={() => showAll(g.type)}>{t('showAll', { n: g.all.length })}</Button>
          </div>
        {/if}
      {/each}
    {:else}
      <Muted>{t('notUsed')}</Muted>
    {/if}
  </Section>
{/if}
