<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  export type BadgeTone = 'craft' | 'refine' | 'cook' | 'none' | 'manual';

  const TONE_VAR: Record<BadgeTone, string> = {
    craft: '--craft',
    refine: '--refine',
    cook: '--cook',
    none: '--none',
    manual: '--manual',
  };

  let { tone, label }: { tone: BadgeTone; label: string } = $props();
</script>

<span
  class="whitespace-nowrap rounded-full border px-2 py-px text-[0.72rem] font-semibold"
  style="color: var({TONE_VAR[tone]}); border-color: currentColor;"
>
  {label}
</span>
