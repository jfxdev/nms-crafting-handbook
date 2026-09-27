<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { iconUrl } from '../lib/data.ts';
  import { loc, t } from '../lib/i18n.svelte.ts';
  import type { ClassDef } from '../lib/parts.ts';
  import type { Item } from '../lib/types.ts';

  let { cls, selected }: { cls: ClassDef; selected: Record<string, Item | undefined> } = $props();

  const layers = $derived(
    cls.slots
      .flatMap((slot) => slot.place.map((place, n) => ({ slot, place, n, item: selected[slot.key] })))
      .sort((a, b) => Number(!!b.place.back) - Number(!!a.place.back)),
  );
  const interior = $derived(cls.slots.filter((s) => !s.place.length));
</script>

<figure class="m-0">
  <div
    class="blueprint border-border relative aspect-square w-full overflow-hidden rounded-[var(--radius)] border"
    role="img"
    aria-label={`${t('preview')}: ${loc(cls.label)} — ${cls.slots
      .map((s) => `${loc(s.label)}: ${selected[s.key] ? loc(selected[s.key]!.name) : t('emptySlot')}`)
      .join('; ')}`}
  >
    {#each layers as { slot, place, n, item } (`${slot.key}-${n}`)}
      <div
        class="absolute -translate-x-1/2 -translate-y-1/2"
        style="left:{place.x}%; top:{place.y}%; width:{place.size}%; aspect-ratio:1;"
      >
        {#if item}
          <img
            src={iconUrl(item)}
            alt=""
            class="part h-full w-full object-contain"
            style="transform: scaleX({place.flip ? -1 : 1}) rotate({place.rotate ?? 0}deg)"
          />
        {:else if n === 0}
          <div
            class="border-muted/50 text-muted flex h-full w-full items-center justify-center rounded-lg border border-dashed p-1 text-center text-[0.65rem] leading-tight sm:text-xs"
          >
            {loc(slot.label)}
          </div>
        {/if}
      </div>
    {/each}
    <span class="text-muted absolute left-3 top-2 text-xs font-semibold uppercase tracking-widest">
      {loc(cls.label)}
    </span>
  </div>
  {#if interior.length}
    <div class="mt-2 flex flex-wrap gap-2">
      {#each interior as slot (slot.key)}
        {@const item = selected[slot.key]}
        <span class="border-border bg-surface2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
          {#if item}<img src={iconUrl(item)} alt="" width="20" height="20" />{/if}
          <span class="text-muted">{loc(slot.label)}:</span>
          {item ? loc(item.name) : t('emptySlot')}
        </span>
      {/each}
    </div>
  {/if}
  <figcaption class="text-muted mt-1.5 text-xs">{t('previewNote')}</figcaption>
</figure>

<style>
  .blueprint {
    background-color: var(--surface-2);
    background-image:
      radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 65%),
      linear-gradient(color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 1px);
    background-size:
      100% 100%,
      8.333% 8.333%,
      8.333% 8.333%;
  }
  .part {
    filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.45));
  }
</style>
