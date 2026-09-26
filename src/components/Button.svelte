<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { Button as Bits } from 'bits-ui';
  import type { Snippet } from 'svelte';

  let {
    variant = 'outline',
    class: className = '',
    children,
    ...rest
  }: {
    variant?: 'outline' | 'solid';
    class?: string;
    children: Snippet;
    [key: string]: unknown;
  } = $props();

  const VARIANT = {
    outline: 'border border-border bg-surface2 text-text hover:border-accent',
    solid: 'bg-accent text-[#111] font-semibold',
  };
</script>

<Bits.Root
  class="cursor-pointer rounded-full border-0 px-3 py-1 text-sm transition-all active:scale-[0.98] {VARIANT[
    variant
  ]} {className}"
  {...rest}
>
  {@render children()}
</Bits.Root>
