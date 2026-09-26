<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import Footer from './views/Footer.svelte';
  import Header from './views/Header.svelte';
  import ItemView from './views/ItemView.svelte';
  import SearchView from './views/SearchView.svelte';
  import { loadStore, type Store } from './lib/data.ts';
  import { t } from './lib/i18n.svelte.ts';
  import { router } from './lib/router.svelte.ts';
  import { createIndex, type ItemIndex } from './lib/search.ts';

  let store = $state<Store | undefined>(undefined);
  let index = $state<ItemIndex | undefined>(undefined);
  let error = $state<string | undefined>(undefined);

  loadStore()
    .then((s) => {
      store = s;
      index = createIndex(s.catalog.items);
    })
    .catch((err: unknown) => {
      error = String(err);
    });

  let lastPath = '';
  $effect(() => {
    const route = router.route;
    const path = route.name === 'item' ? `item/${route.id}` : 'search';
    if (path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
  });

  $effect(() => {
    document.title = t('title');
  });
</script>

{#if error}
  <main class="mx-auto max-w-[1100px] px-4 py-8">Failed to load the catalog: {error}</main>
{:else if !store || !index}
  <main class="mx-auto max-w-[1100px] px-4 py-8">
    <p class="text-muted">Loading…</p>
  </main>
{:else}
  <Header {store} />
  <main class="mx-auto min-h-[60vh] max-w-[1100px] px-4 pb-8 pt-4" aria-live="polite">
    {#if router.route.name === 'item'}
      <ItemView {store} id={router.route.id} />
    {:else}
      <SearchView {store} {index} />
    {/if}
  </main>
  <Footer {store} />
{/if}
