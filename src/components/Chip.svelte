<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    href,
    active = false,
    children,
  }: {
    href: string;
    active?: boolean;
    children: Snippet;
  } = $props();
</script>

<a
  {href}
  aria-current={active ? 'true' : undefined}
  class="cursor-pointer rounded-full border px-3 py-1 text-sm no-underline transition-all active:scale-[0.98]
    {active
    ? 'bg-accent border-accent font-semibold text-[#111]'
    : 'border-border bg-surface2 text-text hover:border-accent'}"
>
  {@render children()}
</a>
