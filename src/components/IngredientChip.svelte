<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { fmt } from '../lib/i18n.svelte.ts';
  import { itemHref } from '../lib/router.svelte.ts';
  import type { Item } from '../lib/types.ts';
  import Icon from './Icon.svelte';

  let {
    item,
    name,
    qty,
    current = false,
    highlight = false,
  }: {
    item: Item | undefined;
    name: string;
    qty: number;
    current?: boolean;
    /** Visually emphasizes the chip (e.g. a recipe's result) without disabling its link. */
    highlight?: boolean;
  } = $props();

  const classes = $derived(
    'inline-flex items-center gap-1.5 rounded-full bg-surface2 py-[3px] pl-[3px] pr-2.5 text-sm border' +
      (current || highlight
        ? ' border-accent font-semibold'
        : ' border-transparent hover:border-accent'),
  );
</script>

{#if current}
  <span class={classes}>
    <Icon {item} size="sm" />
    <span class="font-bold tabular-nums">{fmt(qty)}×</span><span>{name}</span>
  </span>
{:else}
  <a href={item ? itemHref(item.id) : '#'} class={classes}>
    <Icon {item} size="sm" />
    <span class="font-bold tabular-nums">{fmt(qty)}×</span><span>{name}</span>
  </a>
{/if}
