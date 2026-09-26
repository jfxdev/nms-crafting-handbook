<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { loc } from '../lib/i18n.svelte.ts';
  import { itemHref } from '../lib/router.svelte.ts';
  import type { Item } from '../lib/types.ts';
  import Card from './Card.svelte';
  import ColourBadge from './ColourBadge.svelte';
  import Icon from './Icon.svelte';
  import ObtainBadges from './ObtainBadges.svelte';

  let { item }: { item: Item } = $props();

  const name = $derived(loc(item.name));
</script>

<Card
  as="a"
  href={itemHref(item.id)}
  class="item-card bg-surface2 relative h-48 overflow-hidden no-underline
    transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-accent
    [&:has(:focus-visible)]:ring-accent/70 [&:has(:focus-visible)]:ring-2"
>
  <div class="absolute inset-0 flex items-start justify-center pt-6">
    <Icon {item} size="lg" />
  </div>
  <div
    class="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pb-2 pt-8"
  >
    <span class="truncate font-bold text-white">{name}</span>
    <span class="truncate text-[0.8rem] text-white/70">{loc(item.group)}</span>
    <div class="mt-1 flex flex-wrap items-center gap-1">
      <ObtainBadges obtain={item.obtain} />
      {#if item.colour}<ColourBadge colour={item.colour} />{/if}
    </div>
  </div>
</Card>
