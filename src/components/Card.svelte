<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    as = 'div',
    href,
    class: className = '',
    children,
    ...rest
  }: {
    as?: 'div' | 'article' | 'a';
    href?: string;
    class?: string;
    children: Snippet;
    [key: string]: unknown;
  } = $props();
</script>

<svelte:element
  this={as}
  {href}
  class="rounded-[var(--radius)] border border-border bg-surface {className}"
  {...rest}
>
  {@render children()}
</svelte:element>
