<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { lang, t } from '../lib/i18n.svelte.ts';
  import IconButton from './IconButton.svelte';

  let {
    value,
    oninput,
    onkeydown,
  }: {
    value: string;
    oninput: (v: string) => void;
    onkeydown?: (e: KeyboardEvent) => void;
  } = $props();

  const SpeechRecognitionCtor: SpeechRecognitionConstructor | undefined =
    typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined;

  let listening = $state(false);
  let recognition: SpeechRecognition | undefined;

  function toggleListen(): void {
    if (!SpeechRecognitionCtor) return;
    if (listening) {
      recognition?.stop();
      return;
    }
    recognition = new SpeechRecognitionCtor();
    recognition.lang = lang.current === 'pt' ? 'pt-BR' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      listening = true;
    };
    recognition.onend = () => {
      listening = false;
    };
    recognition.onerror = () => {
      listening = false;
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript.trim();
      if (transcript) oninput(transcript);
    };
    recognition.start();
  }
</script>

<div class="relative">
  <input
    id="q"
    type="search"
    autocomplete="off"
    spellcheck="false"
    class="border-border bg-surface2 text-text w-full rounded-[var(--radius)] border py-2.5 pl-3.5 text-base
      {SpeechRecognitionCtor ? 'pr-11' : 'pr-3.5'}"
    placeholder={listening ? t('listening') : t('searchPlaceholder')}
    aria-label={t('searchPlaceholder')}
    {value}
    oninput={(e) => oninput(e.currentTarget.value)}
    {onkeydown}
  />
  {#if SpeechRecognitionCtor}
    <IconButton
      type="button"
      onclick={toggleListen}
      aria-label={t('voiceSearch')}
      aria-pressed={listening}
      class="absolute right-1.5 top-1/2 -translate-y-1/2
        {listening ? 'border-accent text-accent animate-pulse' : ''}"
    >
      🎤
    </IconButton>
  {/if}
</div>
