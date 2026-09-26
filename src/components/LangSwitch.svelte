<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { ToggleGroup } from 'bits-ui';
  import { lang, setLang } from '../lib/i18n.svelte.ts';
  import type { Lang } from '../lib/types.ts';
</script>

<ToggleGroup.Root
  type="single"
  value={lang.current}
  onValueChange={(v) => v && setLang(v as Lang)}
  class="border-border inline-flex overflow-hidden rounded-full border"
  aria-label="Language"
>
  {#each ['pt', 'en'] as const as l (l)}
    <ToggleGroup.Item
      value={l}
      class="bg-surface2 text-text cursor-pointer border-0 px-3 py-1 text-sm font-medium
        data-[state=on]:bg-accent data-[state=on]:font-semibold data-[state=on]:text-[#111]"
    >
      {l.toUpperCase()}
    </ToggleGroup.Item>
  {/each}
</ToggleGroup.Root>
