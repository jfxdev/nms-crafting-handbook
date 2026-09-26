<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Store } from '../lib/data.ts';
  import { t } from '../lib/i18n.svelte.ts';

  let { store }: { store: Store } = $props();
  const sha = $derived(store.catalog.source.sha.slice(0, 7));
</script>

<footer class="border-border text-muted mx-auto max-w-[1100px] border-t px-4 pb-6 pt-3 text-[0.85rem]">
  {t('footer')} Source: AssistantNMS@{sha}.
</footer>
