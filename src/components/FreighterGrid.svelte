<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { iconUrl } from '../lib/data.ts';
  import {
    DIRS,
    key,
    links,
    type FreighterKind,
    type Plan,
    type Pos,
  } from '../lib/freighter.ts';
  import { loc } from '../lib/i18n.svelte.ts';
  import type { Item } from '../lib/types.ts';

  let {
    plan,
    deck,
    cellPx,
    itemOf,
    kindOf,
    flagged,
    selected,
    label,
    onCell,
  }: {
    plan: Plan;
    deck: number;
    cellPx: number;
    itemOf: (id: string) => Item | undefined;
    kindOf: (id: string) => FreighterKind | undefined;
    /** Keys of cells to outline as problems. */
    flagged: Set<string>;
    selected: Pos | undefined;
    label: string;
    /** "down" starts a stroke (click / tap), "drag" continues it (mouse drag). */
    onCell: (p: Pos, phase: 'down' | 'drag') => void;
  } = $props();

  const S = 48;
  const C = S / 2;
  const BAR = 14;

  interface Drawn {
    p: Pos;
    k: string;
    id: string;
    item: Item | undefined;
    kind: FreighterKind | undefined;
    l: boolean[];
  }

  const cellsOn = (z: number): Drawn[] =>
    Object.entries(plan.cells)
      .map(([k, id]) => {
        const [x, y, cz] = k.split(',').map(Number) as [number, number, number];
        return { p: { x, y, z: cz }, k, id };
      })
      .filter((c) => c.p.z === z)
      .map((c) => ({ ...c, item: itemOf(c.id), kind: kindOf(c.id), l: links(plan, c.p) }));

  const current = $derived(cellsOn(deck));
  const below = $derived(cellsOn(deck - 1));
  /** Stairs on the deck below arrive here. */
  const arrivals = $derived(below.filter((c) => c.kind === 'stairs').map((c) => c.p));

  /** Corridor colour by style: glass, passageway, standard. */
  function tone(id: string): string {
    if (id === 'build865' || id === 'build996') return 'var(--gt-technology)';
    if (id === 'FRE_CORR_B' || id === 'FRE_CORR_STA_B') return 'var(--gt-earth)';
    return 'var(--muted)';
  }

  // Pointer handling: mouse/pen paint while dragging; touch only acts on a tap (so the page scrolls).
  let svg: SVGSVGElement;
  let dragging = false;
  let last: Pos | undefined;
  let touchStart: { x: number; y: number } | undefined;
  let hover = $state<Pos | undefined>(undefined);

  function cellAt(e: PointerEvent): Pos | undefined {
    const m = svg.getScreenCTM();
    if (!m) return undefined;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const x = Math.floor(pt.x / S);
    const y = Math.floor(pt.y / S);
    return x >= 0 && y >= 0 && x < plan.w && y < plan.h ? { x, y, z: deck } : undefined;
  }

  function down(e: PointerEvent): void {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch') {
      touchStart = { x: e.clientX, y: e.clientY };
      return;
    }
    const p = cellAt(e);
    if (!p) return;
    dragging = true;
    last = p;
    svg.setPointerCapture(e.pointerId);
    onCell(p, 'down');
  }

  function move(e: PointerEvent): void {
    if (e.pointerType === 'touch') return;
    const p = cellAt(e);
    hover = p;
    if (!dragging || !p || !last || key(p) === key(last)) return;
    // Fast strokes skip cells between two events: fill the line between them, stepping
    // orthogonally so the painted cells stay connected (modules only join side by side).
    const from = last;
    const steps = Math.max(Math.abs(p.x - from.x), Math.abs(p.y - from.y));
    let prev = from;
    for (let i = 1; i <= steps; i++) {
      const cur = {
        x: Math.round(from.x + ((p.x - from.x) * i) / steps),
        y: Math.round(from.y + ((p.y - from.y) * i) / steps),
        z: deck,
      };
      if (cur.x !== prev.x && cur.y !== prev.y) onCell({ ...cur, y: prev.y }, 'drag');
      onCell(cur, 'drag');
      prev = cur;
    }
    last = p;
  }

  function up(e: PointerEvent): void {
    dragging = false;
    if (e.pointerType !== 'touch' || !touchStart) return;
    const moved = Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y);
    touchStart = undefined;
    const p = cellAt(e);
    if (p && moved < 10) onCell(p, 'down');
  }
</script>

<svg
  bind:this={svg}
  viewBox="0 0 {plan.w * S} {plan.h * S}"
  width={plan.w * cellPx}
  height={plan.h * cellPx}
  class="block touch-manipulation select-none"
  role="img"
  aria-label={label}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={() => (dragging = false)}
  onpointerleave={() => (hover = undefined)}
>
  <!-- Grid -->
  <rect width={plan.w * S} height={plan.h * S} fill="var(--surface-2)" />
  {#each { length: plan.w + 1 } as _, i (i)}
    <line x1={i * S} y1="0" x2={i * S} y2={plan.h * S} class="grid" />
  {/each}
  {#each { length: plan.h + 1 } as _, i (i)}
    <line x1="0" y1={i * S} x2={plan.w * S} y2={i * S} class="grid" />
  {/each}

  <!-- Deck below, as a faint footprint -->
  {#each below as c (c.k)}
    <rect x={c.p.x * S + 6} y={c.p.y * S + 6} width={S - 12} height={S - 12} rx="6" class="ghost" />
  {/each}

  <!-- Modules -->
  {#each current as c (c.k)}
    {@const x0 = c.p.x * S}
    {@const y0 = c.p.y * S}
    <g transform="translate({x0} {y0})">
      <title>{c.item ? loc(c.item.name) : c.id}</title>
      {#if c.kind === 'room'}
        {#each DIRS as d, i (i)}
          {#if c.l[i]}
            <!-- Doorway on the shared edge -->
            <rect
              x={C - BAR / 2 + d.dx * (C - 3)}
              y={C - BAR / 2 + d.dy * (C - 3)}
              width={BAR}
              height={BAR}
              fill="var(--accent)"
            />
          {/if}
        {/each}
        <rect x="3" y="3" width={S - 6} height={S - 6} rx="7" class="room" />
        {#if c.item?.icon}
          <image href={iconUrl(c.item)} x="8" y="8" width={S - 16} height={S - 16} />
        {/if}
      {:else}
        {@const col = tone(c.id)}
        {@const ext = c.kind === 'exterior'}
        {#each DIRS as d, i (i)}
          {#if c.l[i]}
            <rect
              x={d.dx === 0 ? C - BAR / 2 : d.dx > 0 ? C : 0}
              y={d.dy === 0 ? C - BAR / 2 : d.dy > 0 ? C : 0}
              width={d.dx === 0 ? BAR : C}
              height={d.dy === 0 ? BAR : C}
              fill={col}
              opacity={ext ? 0.55 : 1}
            />
          {/if}
        {/each}
        {#if ext}
          <rect x="6" y="6" width={S - 12} height={S - 12} rx="3" class="exterior" stroke={col} />
        {:else}
          <rect x={C - 11} y={C - 11} width="22" height="22" rx="5" fill={col} />
        {/if}
        {#if c.kind === 'stairs'}
          <rect x="8" y="8" width={S - 16} height={S - 16} rx="5" fill={col} />
          {#each [0, 1, 2] as s (s)}
            <line x1="13" x2={S - 13} y1={30 - s * 6} y2={30 - s * 6} class="step" />
          {/each}
          <path d="M{C - 6} 14 L{C} 8 L{C + 6} 14 Z" class="arrow" />
        {/if}
      {/if}
      {#if flagged.has(c.k)}
        <rect x="1.5" y="1.5" width={S - 3} height={S - 3} rx="8" class="flag" />
      {/if}
    </g>
  {/each}

  <!-- Stairs arriving from the deck below -->
  {#each arrivals as p (key(p))}
    {#if plan.cells[key({ ...p, z: deck })]}
      <path
        d="M{p.x * S + S - 15} {p.y * S + S - 12} l6 6 l6 -6 Z"
        class="arrow"
      />
    {:else}
      <rect
        x={p.x * S + 4}
        y={p.y * S + 4}
        width={S - 8}
        height={S - 8}
        rx="6"
        class="landing"
      />
    {/if}
  {/each}

  <!-- Entrance -->
  {#if plan.entrance.z === deck}
    <g transform="translate({plan.entrance.x * S} {plan.entrance.y * S})">
      <rect x="1.5" y="1.5" width={S - 3} height={S - 3} rx="8" class="entrance" />
      <circle cx="10" cy="10" r="7" fill="var(--cook)" />
      <path d="M7 14 V6 L13 8.5 L8 10" fill="none" stroke="#fff" stroke-width="1.6" />
    </g>
  {/if}

  {#if hover}
    <rect x={hover.x * S} y={hover.y * S} width={S} height={S} class="hover" />
  {/if}
  {#if selected && selected.z === deck}
    <rect
      x={selected.x * S + 1}
      y={selected.y * S + 1}
      width={S - 2}
      height={S - 2}
      rx="8"
      class="selected"
    />
  {/if}
</svg>

<style>
  .grid {
    stroke: var(--border);
    stroke-width: 1;
  }
  .ghost {
    fill: none;
    stroke: var(--muted);
    stroke-dasharray: 3 3;
    opacity: 0.45;
  }
  .room {
    fill: var(--surface);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .exterior {
    fill: none;
    stroke-width: 2;
    stroke-dasharray: 5 3;
  }
  .step {
    stroke: var(--surface);
    stroke-width: 2;
  }
  .arrow {
    fill: var(--surface);
    stroke: var(--text);
    stroke-width: 1;
  }
  .landing {
    fill: none;
    stroke: var(--refine);
    stroke-width: 2;
    stroke-dasharray: 4 3;
  }
  .flag {
    fill: none;
    stroke: var(--gt-fuel);
    stroke-width: 3;
  }
  .entrance {
    fill: none;
    stroke: var(--cook);
    stroke-width: 3;
  }
  .hover {
    fill: var(--accent);
    opacity: 0.15;
    pointer-events: none;
  }
  .selected {
    fill: none;
    stroke: var(--focus);
    stroke-width: 3;
  }
</style>
