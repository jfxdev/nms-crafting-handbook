<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    small = false,
    class: className = '',
    children,
  }: {
    small?: boolean;
    class?: string;
    children: Snippet;
  } = $props();
</script>

<span class="text-muted {small ? 'text-[0.85rem]' : ''} {className}">
  {@render children()}
</span>
