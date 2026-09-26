// SPDX-License-Identifier: GPL-3.0-or-later
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under /<repo>/ and locally.
export default defineConfig({
  base: './',
  plugins: [tailwindcss(), svelte()],
  build: { target: 'es2022' },
  test: { include: ['tests/**/*.test.ts'] },
} as never);
