<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import FreighterGrid from '../components/FreighterGrid.svelte';
  import Heading from '../components/Heading.svelte';
  import Icon from '../components/Icon.svelte';
  import IconButton from '../components/IconButton.svelte';
  import Muted from '../components/Muted.svelte';
  import type { Store } from '../lib/data.ts';
  import {
    above,
    corridorShape,
    counts,
    decodePlan,
    emptyPlan,
    encodePlan,
    inBounds,
    issues,
    key,
    KIND_ORDER,
    LIMITS,
    links,
    parseKey,
    type FreighterKind,
    type Plan,
    type Pos,
  } from '../lib/freighter.ts';
  import { fmt, lang, loc, t, type StringKey } from '../lib/i18n.svelte.ts';
  import { itemHref, replaceHash, router } from '../lib/router.svelte.ts';

  let { store }: { store: Store } = $props();

  const STORAGE_KEY = 'nms-handbook:freighter';
  const HISTORY = 100;

  const modules = $derived(store.catalog.items.filter((i) => i.freighter));
  const palette = $derived(
    KIND_ORDER.map((kind) => ({
      kind,
      items: modules
        .filter((i) => i.freighter === kind)
        .sort((a, b) => loc(a.name).localeCompare(loc(b.name), lang.current, { numeric: true })),
    })).filter((g) => g.items.length),
  );
  const itemOf = (id: string) => store.items.get(id);
  const kindOf = (id: string) => store.items.get(id)?.freighter;
  const known = (id: string) => !!store.items.get(id)?.freighter;

  function initialPlan(): Plan {
    const fromUrl = router.route.params.get('p');
    if (fromUrl) {
      const shared = decodePlan(fromUrl, known);
      // Keep the address clean so a reload uses the saved (possibly edited) copy.
      replaceHash('#/freighter');
      if (shared) return shared;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const plan = saved ? decodePlan(saved, known) : undefined;
      if (plan) return plan;
    } catch {
      /* storage unavailable */
    }
    return emptyPlan();
  }

  const start = initialPlan();
  let plan = $state<Plan>(start);
  let deck = $state(start.entrance.z);
  type Tool =
    | { type: 'paint'; id: string }
    | { type: 'erase' }
    | { type: 'select' }
    | { type: 'entrance' };
  let tool = $state<Tool>({ type: 'select' });
  let selected = $state<Pos | undefined>(undefined);
  let past = $state<string[]>([]);
  let future = $state<string[]>([]);
  let copied = $state(false);
  let importError = $state(false);
  let zoom = $state(1);
  let viewport = $state(0);

  const code = $derived(encodePlan(plan));
  $effect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage unavailable */
    }
  });

  function snapshot(): void {
    past = [...past.slice(-HISTORY + 1), code];
    future = [];
  }
  function restore(from: string[], to: string[]): [string[], string[]] {
    const prev = from.at(-1);
    const p = prev && decodePlan(prev, known);
    if (!p) return [from, to];
    const next: [string[], string[]] = [from.slice(0, -1), [...to, code]];
    plan = p;
    deck = Math.min(Math.max(deck, p.decks[0]), p.decks[1]);
    return next;
  }
  const undo = () => ([past, future] = restore(past, future));
  const redo = () => ([future, past] = restore(future, past));

  function onCell(p: Pos, phase: 'down' | 'drag'): void {
    const k = key(p);
    if (tool.type === 'select') {
      selected = p;
      return;
    }
    if (tool.type === 'entrance') {
      if (phase !== 'down') return;
      snapshot();
      plan.entrance = p;
      selected = p;
      return;
    }
    const next = tool.type === 'paint' ? tool.id : undefined;
    if (plan.cells[k] === next) return;
    if (phase === 'down') snapshot();
    if (next) plan.cells[k] = next;
    else delete plan.cells[k];
    selected = p;
  }

  function onKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    } else if (e.key === 'Escape') tool = { type: 'select' };
  }

  // Decks and grid size.
  const decks = $derived(
    Array.from({ length: plan.decks[1] - plan.decks[0] + 1 }, (_, i) => plan.decks[1] - i),
  );
  const deckEmpty = (z: number) => !Object.keys(plan.cells).some((k) => parseKey(k).z === z);
  const deckLabel = (z: number) => t('deck', { n: z > 0 ? `+${z}` : z });

  function addDeck(dir: 1 | -1): void {
    if (plan.decks[1] - plan.decks[0] + 1 >= LIMITS.maxDecks) return;
    snapshot();
    if (dir > 0) plan.decks = [plan.decks[0], plan.decks[1] + 1];
    else plan.decks = [plan.decks[0] - 1, plan.decks[1]];
    deck = dir > 0 ? plan.decks[1] : plan.decks[0];
  }
  const canRemoveDeck = $derived(
    decks.length > 1 &&
      (deck === plan.decks[0] || deck === plan.decks[1]) &&
      deck !== plan.entrance.z &&
      deckEmpty(deck),
  );
  function removeDeck(): void {
    if (!canRemoveDeck) return;
    snapshot();
    plan.decks = deck === plan.decks[1] ? [plan.decks[0], deck - 1] : [deck + 1, plan.decks[1]];
    deck = Math.min(Math.max(deck, plan.decks[0]), plan.decks[1]);
  }

  function resize(dim: 'w' | 'h', v: string): void {
    const n = Math.min(LIMITS.maxSize, Math.max(LIMITS.minSize, Math.floor(Number(v) || 0)));
    if (n === plan[dim]) return;
    snapshot();
    plan[dim] = n;
    for (const k of Object.keys(plan.cells)) if (!inBounds(plan, parseKey(k))) delete plan.cells[k];
    plan.entrance = {
      ...plan.entrance,
      x: Math.min(plan.entrance.x, plan.w - 1),
      y: Math.min(plan.entrance.y, plan.h - 1),
    };
  }

  function clearDeck(): void {
    snapshot();
    for (const k of Object.keys(plan.cells)) if (parseKey(k).z === deck) delete plan.cells[k];
  }
  function newPlan(): void {
    if (!confirm(t('confirmNew'))) return;
    snapshot();
    plan = emptyPlan(plan.w, plan.h);
    deck = 0;
    selected = undefined;
  }

  // Sharing, export and import.
  async function copyLink(): Promise<void> {
    const url = `${location.href.split('#')[0]}#/freighter?p=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }
  function exportFile(): void {
    const blob = new Blob([JSON.stringify({ format: 'nms-handbook-freighter', code }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'freighter-plan.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importFile(e: Event & { currentTarget: HTMLInputElement }): Promise<void> {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    let next: Plan | undefined;
    try {
      const data = JSON.parse(await file.text()) as { code?: unknown };
      next = typeof data.code === 'string' ? decodePlan(data.code, known) : undefined;
    } catch {
      next = undefined;
    }
    importError = !next;
    if (!next) return;
    snapshot();
    plan = next;
    deck = next.entrance.z;
    selected = undefined;
  }

  // Derived views.
  const problems = $derived(issues(plan, kindOf));
  const flagged = $derived(
    new Set(problems.filter((i) => i.type !== 'noEntrance' && i.at).map((i) => key(i.at!))),
  );
  const problemSummary = $derived(
    (['noEntrance', 'unreachable', 'stairsNowhere'] as const)
      .map((type) => ({ type, list: problems.filter((i) => i.type === type) }))
      .filter((g) => g.list.length),
  );
  const placed = $derived(
    [...counts(plan)]
      .map(([id, n]) => ({ item: itemOf(id), id, n }))
      .sort((a, b) =>
        (a.item ? loc(a.item.name) : a.id).localeCompare(
          b.item ? loc(b.item.name) : b.id,
          lang.current,
          { numeric: true },
        ),
      ),
  );
  const materials = $derived.by(() => {
    const m = new Map<string, number>();
    for (const { id, n } of placed) {
      const rid = (store.catalog.producedBy[id] ?? []).find(
        (r) => store.recipes.get(r)?.type === 'craft',
      );
      for (const q of (rid && store.recipes.get(rid)?.inputs) || [])
        m.set(q.id, (m.get(q.id) ?? 0) + q.qty * n);
    }
    return [...m]
      .map(([id, qty]) => ({ item: store.items.get(id)!, qty }))
      .sort((a, b) => b.qty - a.qty);
  });

  const sel = $derived.by(() => {
    if (!selected) return undefined;
    const id = plan.cells[key(selected)];
    const item = id ? itemOf(id) : undefined;
    const kind = id ? kindOf(id) : undefined;
    return { p: selected, id, item, kind, l: links(plan, selected) };
  });

  const cellPx = $derived(
    Math.round(
      Math.min(64, Math.max(22, viewport ? (viewport - 2) / plan.w : 40)) * zoom,
    ),
  );
  const paintItem = $derived(tool.type === 'paint' ? itemOf(tool.id) : undefined);
  const kindLabel = (k: FreighterKind) => t(`kind_${k}` as StringKey);
  const toolBtn = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm cursor-pointer ${
      active
        ? 'bg-accent border-accent font-semibold text-[#111]'
        : 'border-border bg-surface2 text-text hover:border-accent'
    }`;
</script>

<svelte:window onkeydown={onKey} />

<Heading level={1} class="mb-1 mt-0">{t('freighter')}</Heading>
<p class="text-muted mt-0 max-w-[75ch] text-sm">{t('freighterIntro')}</p>
<p class="text-muted mt-0 max-w-[75ch] text-xs">{t('freighterNote')}</p>

<div class="mt-3 grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
  <!-- Palette -->
  <aside
    class="border-border bg-surface max-h-64 overflow-y-auto rounded-[var(--radius)] border p-2 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]"
    aria-label={t('modules')}
  >
    <div class="flex flex-wrap gap-1.5 pb-2">
      {#each [['select', 'toolSelect', '🔍'], ['erase', 'toolErase', '⌫'], ['entrance', 'toolEntrance', '⚑']] as const as [type, label, glyph] (type)}
        <button
          type="button"
          class={toolBtn(tool.type === type)}
          aria-pressed={tool.type === type}
          onclick={() => (tool = { type } as Tool)}
        >
          <span aria-hidden="true">{glyph}</span>
          {t(label)}
        </button>
      {/each}
    </div>
    {#each palette as g (g.kind)}
      <h3 class="text-muted mb-1 mt-2 text-xs font-semibold uppercase tracking-wide">
        {kindLabel(g.kind)}
      </h3>
      <ul class="m-0 grid list-none gap-1 p-0">
        {#each g.items as item (item.id)}
          {@const active = tool.type === 'paint' && tool.id === item.id}
          <li>
            <button
              type="button"
              aria-pressed={active}
              title={loc(item.name)}
              onclick={() => (tool = { type: 'paint', id: item.id })}
              class="flex w-full cursor-pointer items-center gap-2 rounded-lg border px-1.5 py-1 text-left text-sm
                {active ? 'border-accent bg-surface2 font-semibold' : 'hover:bg-surface2 border-transparent'}"
            >
              <Icon {item} size="sm" />
              <span class="min-w-0 flex-1 truncate">{loc(item.name)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/each}
  </aside>

  <div class="min-w-0">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Decks">
        {#each decks as z (z)}
          <button
            type="button"
            class={toolBtn(z === deck)}
            aria-pressed={z === deck}
            onclick={() => (deck = z)}
          >
            {deckLabel(z)}{#if z === plan.entrance.z}<span aria-hidden="true"> ⚑</span>{/if}
          </button>
        {/each}
      </div>
      <IconButton onclick={() => addDeck(1)} title={t('addDeckAbove')} aria-label={t('addDeckAbove')}
        >⤒</IconButton
      >
      <IconButton onclick={() => addDeck(-1)} title={t('addDeckBelow')} aria-label={t('addDeckBelow')}
        >⤓</IconButton
      >
      {#if canRemoveDeck}
        <IconButton onclick={removeDeck} title={t('removeDeck')} aria-label={t('removeDeck')}>✕</IconButton>
      {/if}
      <span class="flex-1"></span>
      <IconButton onclick={undo} disabled={!past.length} title={t('undo')} aria-label={t('undo')}>↶</IconButton>
      <IconButton onclick={redo} disabled={!future.length} title={t('redo')} aria-label={t('redo')}>↷</IconButton>
      <IconButton onclick={() => (zoom = Math.max(0.5, zoom - 0.25))} title={t('zoomOut')} aria-label={t('zoomOut')}
        >−</IconButton
      >
      <IconButton onclick={() => (zoom = Math.min(2.5, zoom + 0.25))} title={t('zoomIn')} aria-label={t('zoomIn')}
        >+</IconButton
      >
    </div>

    <p class="my-2 text-sm">
      <Muted>
        {paintItem ? t('paintHint', { name: loc(paintItem.name) }) : t('pickModule')}
      </Muted>
    </p>

    <!-- Grid -->
    <div class="text-muted text-center text-xs uppercase tracking-widest">▲ {t('bow')}</div>
    <div
      class="border-border overflow-auto rounded-[var(--radius)] border"
      bind:clientWidth={viewport}
    >
      <div class="mx-auto w-max">
        <FreighterGrid
          {plan}
          {deck}
          {cellPx}
          {itemOf}
          {kindOf}
          {flagged}
          {selected}
          label={`${t('freighter')} — ${deckLabel(deck)}`}
          {onCell}
        />
      </div>
    </div>
    <div class="text-muted text-center text-xs uppercase tracking-widest">{t('stern')}</div>

    <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span class="text-muted">{t('gridSize')}:</span>
      <label class="inline-flex items-center gap-1">
        {t('width')}
        <input
          type="number"
          min={LIMITS.minSize}
          max={LIMITS.maxSize}
          value={plan.w}
          onchange={(e) => resize('w', e.currentTarget.value)}
          class="border-border bg-surface text-text w-16 rounded-lg border px-2 py-0.5"
        />
      </label>
      <label class="inline-flex items-center gap-1">
        {t('length')}
        <input
          type="number"
          min={LIMITS.minSize}
          max={LIMITS.maxSize}
          value={plan.h}
          onchange={(e) => resize('h', e.currentTarget.value)}
          class="border-border bg-surface text-text w-16 rounded-lg border px-2 py-0.5"
        />
      </label>
      <span class="flex-1"></span>
      <Button onclick={clearDeck}>{t('clearDeck')}</Button>
      <Button onclick={newPlan}>{t('newPlan')}</Button>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <!-- Selected cell -->
      <Card class="p-3">
        {#if sel}
          <p class="text-muted m-0 text-xs">
            {t('cellAt', { x: sel.p.x + 1, y: sel.p.y + 1, z: sel.p.z })}
          </p>
          {#if sel.item}
            <p class="m-0 mt-1 flex items-center gap-2 font-semibold">
              <Icon item={sel.item} size="sm" />
              <a href={itemHref(sel.item.id)}>{loc(sel.item.name)}</a>
            </p>
            <p class="m-0 mt-1 text-sm">
              <Muted>{sel.kind ? kindLabel(sel.kind) : ''}</Muted>
              {#if sel.kind === 'corridor'}
                · {t('shapeIs', { shape: t(`shape_${corridorShape(sel.l)}` as StringKey) })}
              {:else if sel.kind === 'stairs'}
                · {t('leadsUp', { n: above(sel.p).z })}
              {/if}
            </p>
          {:else}
            <p class="m-0 mt-1"><Muted>{t('cellEmpty')}</Muted></p>
          {/if}
        {:else}
          <p class="m-0"><Muted small>{t('pickModule')}</Muted></p>
        {/if}
      </Card>

      <!-- Checks -->
      <Card class="p-3">
        <Heading level={3} class="m-0">{t('checks')}</Heading>
        {#if !placed.length}
          <p class="m-0 mt-1"><Muted small>{t('noModules')}</Muted></p>
        {:else if !problemSummary.length}
          <p class="m-0 mt-1 text-sm" style="color: var(--cook)">✓ {t('allGood')}</p>
        {:else}
          <ul class="m-0 mt-1 grid list-none gap-1 p-0 text-sm">
            {#each problemSummary as g (g.type)}
              <li style="color: var(--gt-fuel)">
                ⚠ {t(`issue_${g.type}` as StringKey, { n: g.list.length, z: plan.entrance.z })}
              </li>
            {/each}
          </ul>
        {/if}
      </Card>

      <!-- Modules and materials -->
      <Card class="p-3 md:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Heading level={3} class="m-0">{t('modules')}</Heading>
          <div class="flex flex-wrap gap-1.5">
            <Button onclick={copyLink} disabled={!placed.length}>
              {copied ? t('copied') : t('copyLink')}
            </Button>
            <Button onclick={exportFile} disabled={!placed.length}>{t('exportJson')}</Button>
            <label
              class="border-border bg-surface2 text-text hover:border-accent cursor-pointer rounded-full border px-3 py-1 text-sm"
            >
              {t('importJson')}
              <input type="file" accept="application/json,.json" class="sr-only" onchange={importFile} />
            </label>
          </div>
        </div>
        {#if importError}
          <p class="m-0 mt-1 text-sm" style="color: var(--gt-fuel)">{t('importError')}</p>
        {/if}
        {#if placed.length}
          <ul class="m-0 mt-2 grid list-none grid-cols-1 gap-1 p-0 sm:grid-cols-2">
            {#each placed as { item, id, n } (id)}
              <li class="flex items-center gap-2 text-sm">
                <Icon {item} size="sm" />
                <a href={itemHref(id)} class="min-w-0 flex-1 truncate">{item ? loc(item.name) : id}</a>
                <strong>× {n}</strong>
              </li>
            {/each}
          </ul>
          {#if materials.length}
            <h4 class="mb-1 mt-3 text-sm font-semibold">{t('materials')}</h4>
            <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {#each materials as { item, qty } (item.id)}
                <li>
                  <a
                    href={itemHref(item.id)}
                    class="border-border bg-surface2 inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2 text-xs no-underline"
                  >
                    <Icon {item} size="sm" />
                    {fmt(qty)} × {loc(item.name)}
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        {:else}
          <p class="m-0 mt-1"><Muted small>{t('noModules')}</Muted></p>
        {/if}
      </Card>
    </div>
  </div>
</div>
