<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { iconUrl } from '../lib/data.ts';
  import type { Item } from '../lib/types.ts';

  const SIZES = { sm: 28, md: 48, lg: 96 } as const;

  let {
    item,
    size = 'md',
    class: className = '',
  }: {
    item: Item | undefined;
    size?: keyof typeof SIZES;
    class?: string;
  } = $props();

  const px = $derived(SIZES[size]);
</script>

<img
  class="bg-surface2 inline-block shrink-0 rounded-md object-contain {className}"
  style={item?.colour ? `--item-colour:#${item.colour}` : ''}
  src={iconUrl(item)}
  alt=""
  loading="lazy"
  width={px}
  height={px}
/>
