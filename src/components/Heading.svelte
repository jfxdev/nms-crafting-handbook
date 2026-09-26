<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    level = 2,
    class: className = '',
    children,
  }: {
    level?: 1 | 2 | 3;
    class?: string;
    children: Snippet;
  } = $props();

  const SIZE = { 1: 'text-2xl sm:text-3xl', 2: 'text-xl sm:text-2xl', 3: 'text-base sm:text-lg' };
</script>

<svelte:element this={`h${level}`} class="font-bold leading-tight {SIZE[level]} {className}">
  {@render children()}
</svelte:element>
