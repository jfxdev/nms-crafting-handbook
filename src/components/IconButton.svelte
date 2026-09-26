<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { Button as Bits } from 'bits-ui';
  import type { Snippet } from 'svelte';

  let {
    class: className = '',
    children,
    ...rest
  }: {
    class?: string;
    children: Snippet;
    [key: string]: unknown;
  } = $props();
</script>

<Bits.Root
  class="border-border bg-surface2 text-text flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border {className}"
  {...rest}
>
  {@render children()}
</Bits.Root>
