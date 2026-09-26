<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { Select } from 'bits-ui';
  import { CATEGORY_LABEL, loc, t } from '../lib/i18n.svelte.ts';

  let {
    categories,
    value,
    onChange,
  }: {
    categories: string[];
    value: string;
    onChange: (v: string) => void;
  } = $props();

  const label = (cat: string) => (CATEGORY_LABEL[cat] ? loc(CATEGORY_LABEL[cat]!) : cat);
</script>

<Select.Root
  type="single"
  value={value || '__all'}
  onValueChange={(v) => onChange(v === '__all' ? '' : v)}
  items={[{ value: '__all', label: t('allCategories') }, ...categories.map((c) => ({ value: c, label: label(c) }))]}
>
  <Select.Trigger
    class="border-border bg-surface text-text w-full max-w-full rounded-[var(--radius)] border px-3 py-1.5 text-left text-sm sm:w-auto"
    aria-label={t('allCategories')}
  >
    <Select.Value placeholder={t('allCategories')} />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      class="border-border bg-surface z-20 max-h-72 overflow-y-auto rounded-[var(--radius)] border shadow-lg"
      sideOffset={4}
    >
      <Select.Item
        value="__all"
        class="data-[highlighted]:bg-surface2 cursor-pointer px-3 py-1.5 text-sm"
      >
        {t('allCategories')}
      </Select.Item>
      {#each categories as cat (cat)}
        <Select.Item
          value={cat}
          class="data-[highlighted]:bg-surface2 cursor-pointer px-3 py-1.5 text-sm"
        >
          {label(cat)}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Portal>
</Select.Root>
