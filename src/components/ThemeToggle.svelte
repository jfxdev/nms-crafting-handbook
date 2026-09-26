<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { t } from '../lib/i18n.svelte.ts';
  import { toggleTheme } from '../lib/theme.svelte.ts';
  import IconButton from './IconButton.svelte';
</script>

<IconButton onclick={toggleTheme} aria-label={t('theme')}>◐</IconButton>
