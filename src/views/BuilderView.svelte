<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import Chip from '../components/Chip.svelte';
  import Heading from '../components/Heading.svelte';
  import Icon from '../components/Icon.svelte';
  import Muted from '../components/Muted.svelte';
  import Section from '../components/Section.svelte';
  import ShipPreview from '../components/ShipPreview.svelte';
  import type { Store } from '../lib/data.ts';
  import { fmt, lang, loc, t } from '../lib/i18n.svelte.ts';
  import { CLASSES, classDef } from '../lib/parts.ts';
  import { normalize } from '../lib/search.ts';
  import { builderHref, itemHref, replaceHash, router } from '../lib/router.svelte.ts';
  import type { Item } from '../lib/types.ts';

  let { store }: { store: Store } = $props();

  const FILTER_FROM = 12;

  const params = $derived(router.route.params);
  const cls = $derived(classDef(params.get('c') ?? '') ?? CLASSES[0]!);

  /** Parts of the current class, grouped by slot and sorted by name. */
  const bySlot = $derived.by(() => {
    const groups = new Map<string, Item[]>(cls.slots.map((s) => [s.key, []]));
    for (const item of store.catalog.items) {
      if (item.part?.cls === cls.key) groups.get(item.part.slot)?.push(item);
    }
    for (const list of groups.values())
      list.sort((a, b) => loc(a.name).localeCompare(loc(b.name), lang.current));
    return groups;
  });
  const total = $derived([...bySlot.values()].reduce((n, l) => n + l.length, 0));

  const selected = $derived.by(() => {
    const out: Record<string, Item | undefined> = {};
    for (const slot of cls.slots) {
      const item = store.items.get(params.get(slot.key) ?? '');
      out[slot.key] = item?.part?.cls === cls.key && item.part.slot === slot.key ? item : undefined;
    }
    return out;
  });
  const chosen = $derived(
    cls.slots.flatMap((s) => (selected[s.key] ? [{ slot: s, item: selected[s.key]! }] : [])),
  );
  const totals = $derived(
    [
      ...chosen
        .reduce((m, { item }) => m.set(item.currency, (m.get(item.currency) ?? 0) + item.value), new Map<string, number>())
        .entries(),
    ].filter(([, v]) => v > 0),
  );

  let filters = $state<Record<string, string>>({});
  let copied = $state(false);

  function update(patch: Record<string, string | undefined>): void {
    const p = new URLSearchParams(params);
    p.set('c', cls.key);
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    replaceHash(builderHref(p));
    router.sync();
  }

  const toggle = (slot: string, id: string) =>
    update({ [slot]: selected[slot]?.id === id ? undefined : id });

  function randomize(): void {
    const patch: Record<string, string | undefined> = {};
    for (const [slot, list] of bySlot) {
      patch[slot] = list.length ? list[Math.floor(Math.random() * list.length)]!.id : undefined;
    }
    update(patch);
  }

  const clear = () => update(Object.fromEntries(cls.slots.map((s) => [s.key, undefined])));

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const visible = (slot: string, list: Item[]) => {
    const q = normalize(filters[slot]?.trim() ?? '');
    return q
      ? list.filter((i) => normalize(`${i.name.en} ${i.name.pt}`).includes(q))
      : list;
  };
</script>

<Heading level={1} class="mb-1 mt-0">{t('builder')}</Heading>
<p class="text-muted mt-0 max-w-[70ch] text-sm">{t('builderIntro')}</p>

<nav class="my-3 flex flex-wrap gap-1.5" aria-label={t('builder')}>
  {#each CLASSES as c (c.key)}
    <Chip href={builderHref({ c: c.key })} active={c.key === cls.key}>{loc(c.label)}</Chip>
  {/each}
</nav>

<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
  <aside class="lg:sticky lg:top-32">
    <ShipPreview {cls} {selected} />

    <Card class="mt-3 p-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Heading level={3} class="m-0">{t('build')}</Heading>
        <div class="flex flex-wrap gap-1.5">
          <Button onclick={randomize} disabled={!total}>🎲 {t('randomize')}</Button>
          <Button onclick={clear} disabled={!chosen.length}>{t('clear')}</Button>
          <Button onclick={copyLink} disabled={!chosen.length}>
            {copied ? t('copied') : t('copyLink')}
          </Button>
        </div>
      </div>
      {#if chosen.length}
        <ul class="m-0 mt-2 grid list-none gap-1.5 p-0">
          {#each chosen as { slot, item } (slot.key)}
            <li class="flex items-center gap-2">
              <Icon {item} size="sm" />
              <a href={itemHref(item.id)} class="min-w-0 flex-1 truncate">{loc(item.name)}</a>
              <Muted small class="shrink-0">{loc(slot.label)}</Muted>
            </li>
          {/each}
        </ul>
        {#if totals.length}
          <p class="mb-0 mt-2 text-sm">
            <Muted>{t('totalValue')}:</Muted>
            <strong>{totals.map(([cur, v]) => `${fmt(v)} ${cur}`).join(' + ')}</strong>
          </p>
        {/if}
      {:else}
        <p class="mb-0 mt-2"><Muted small>{t('noSelection')}</Muted></p>
      {/if}
    </Card>
  </aside>

  <div>
    {#if !total}
      <Card class="p-3 text-sm">
        {cls.kind === 'corvette' ? t('corvetteNoData') : t('noResults')}
      </Card>
    {/if}
    {#each cls.slots as slot (slot.key)}
      {@const list = bySlot.get(slot.key) ?? []}
      {#if list.length}
        {@const shown = visible(slot.key, list)}
        <Section title={loc(slot.label)} count={list.length}>
          {#snippet actions()}
            {#if list.length > FILTER_FROM}
              <input
                type="search"
                placeholder={t('filterParts')}
                aria-label={`${t('filterParts')} ${loc(slot.label)}`}
                value={filters[slot.key] ?? ''}
                oninput={(e) => (filters[slot.key] = e.currentTarget.value)}
                class="border-border bg-surface text-text w-44 rounded-lg border px-2 py-1 text-sm"
              />
            {/if}
          {/snippet}
          <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {#each shown as item (item.id)}
              {@const active = selected[slot.key]?.id === item.id}
              <button
                type="button"
                aria-pressed={active}
                title={loc(item.name)}
                onclick={() => toggle(slot.key, item.id)}
                class="bg-surface2 flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius)] border p-1.5 text-center text-xs transition-all
                  {active ? 'border-accent ring-accent/60 ring-2' : 'border-border hover:border-accent'}"
              >
                <Icon {item} size="md" class="bg-transparent" />
                <span class="line-clamp-2 leading-tight">{loc(item.name)}</span>
              </button>
            {/each}
          </div>
        </Section>
      {/if}
    {/each}
  </div>
</div>
