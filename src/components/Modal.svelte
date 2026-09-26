<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { Dialog } from 'bits-ui';
  import type { Snippet } from 'svelte';

  let {
    title,
    trigger,
    children,
    closeLabel = 'Close',
    triggerClass = '',
  }: {
    title: string;
    trigger: Snippet;
    children: Snippet;
    closeLabel?: string;
    triggerClass?: string;
  } = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger class={triggerClass}>
    {@render trigger()}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-30 bg-black/50" />
    <Dialog.Content
      class="border-border bg-surface text-text fixed left-1/2 top-1/2 z-40 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border p-4 shadow-lg"
    >
      <div class="flex items-start justify-between gap-3">
        <Dialog.Title class="text-lg font-bold">{title}</Dialog.Title>
        <Dialog.Close
          class="text-muted -mr-1 -mt-1 shrink-0 cursor-pointer rounded-full p-1 text-lg leading-none"
          aria-label={closeLabel}
        >
          ✕
        </Dialog.Close>
      </div>
      <div class="mt-2 text-sm">
        {@render children()}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
