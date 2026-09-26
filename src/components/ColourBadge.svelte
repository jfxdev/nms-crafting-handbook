<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  let { colour }: { colour: string } = $props();
</script>

<span
  class="inline-block size-5 shrink-0 rounded-md border border-white/20"
  style="background:#{colour}"
  role="img"
  aria-label="Colour #{colour}"
  title="#{colour}"
></span>
