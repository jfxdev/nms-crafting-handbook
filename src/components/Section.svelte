<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    count,
    actions,
    children,
    class: className = '',
  }: {
    title?: string;
    count?: number;
    actions?: Snippet;
    children: Snippet;
    class?: string;
  } = $props();
</script>

<section class="mt-7 first:mt-0 {className}">
  {#if title}
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-xl font-bold sm:text-2xl">
        {title}
        {#if count !== undefined}<span class="text-muted font-normal">({count})</span>{/if}
      </h2>
      {#if actions}{@render actions()}{/if}
    </div>
  {/if}
  {@render children()}
</section>
