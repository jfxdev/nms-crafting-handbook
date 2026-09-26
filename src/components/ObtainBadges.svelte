<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { loc, RECIPE_LABEL, t } from '../lib/i18n.svelte.ts';
  import type { RecipeType } from '../lib/types.ts';
  import Badge from './Badge.svelte';

  let { obtain }: { obtain: RecipeType[] } = $props();
</script>

<span class="mt-1 flex flex-wrap gap-1">
  {#if !obtain.length}
    <Badge tone="none" label={t('noRecipe')} />
  {:else}
    {#each obtain as o (o)}
      <Badge tone={o} label={loc(RECIPE_LABEL[o])} />
    {/each}
  {/if}
</span>
