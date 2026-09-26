<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import LangSwitch from '../components/LangSwitch.svelte';
  import Modal from '../components/Modal.svelte';
  import SearchInput from '../components/SearchInput.svelte';
  import ThemeToggle from '../components/ThemeToggle.svelte';
  import type { Store } from '../lib/data.ts';
  import { lang, t } from '../lib/i18n.svelte.ts';
  import { replaceHash, router, searchHref } from '../lib/router.svelte.ts';

  let { store }: { store: Store } = $props();

  const s = $derived(store.catalog.source);

  let searchValue = $state(
    router.route.name === 'search' ? (router.route.params.get('q') ?? '') : '',
  );

  $effect(() => {
    const route = router.route;
    if (route.name === 'search' && document.activeElement?.id !== 'q') {
      searchValue = route.params.get('q') ?? '';
    }
  });

  function onSearchInput(v: string): void {
    searchValue = v;
    const route = router.route;
    const params = route.name === 'search' ? new URLSearchParams(route.params) : new URLSearchParams();
    if (v.trim()) params.set('q', v);
    else params.delete('q');
    replaceHash(searchHref(params));
    router.sync();
  }

  function onSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      document.querySelector<HTMLAnchorElement>('.item-card')?.focus();
    }
  }

  const date = $derived(new Date(s.commitDate).toLocaleDateString(lang.current === 'pt' ? 'pt-BR' : 'en-US'));
</script>

<header class="border-border bg-surface sticky top-0 z-10 border-b pb-1 pt-2.5">
  <div class="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-4 pb-2">
    <a href="#/" class="text-accent shrink-0 text-sm font-bold tracking-wide no-underline sm:text-base">
      {t('title')}
    </a>
    <div class="flex flex-wrap items-center gap-2">
      <Modal
        title={t('aboutData')}
        closeLabel={t('close')}
        triggerClass="border-border bg-surface2 text-text flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
      >
        {#snippet trigger()}
          <span aria-hidden="true">ⓘ</span>
          <span>NMS {s.gameVersion}</span>
        {/snippet}
        <p>
          {t('dataVersion', { v: s.gameVersion, name: s.gameVersionName })}
          {#if s.stale}
            <span style="color: var(--refine)">
              — {t('staleWarning', { date, name: s.gameVersionName })}
            </span>
          {/if}
        </p>
      </Modal>
      <LangSwitch />
      <ThemeToggle />
    </div>
  </div>
  <div class="mx-auto max-w-[1100px] px-4 pb-1.5">
    <SearchInput value={searchValue} oninput={onSearchInput} onkeydown={onSearchKeydown} />
  </div>
</header>
