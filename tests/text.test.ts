// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { gameTextToHtml } from '../src/lib/gametext.ts';
import { createIndex, normalize } from '../src/lib/search.ts';
import type { Item } from '../src/lib/types.ts';

describe('gameTextToHtml', () => {
  it('converts nested game markup and escapes html', () => {
    const html = gameTextToHtml(
      'Use <VAL_ON>Plot (<IMG>FE_ALT1<>)<> & <EARTH>Ferrite<>\n\n<script>',
    );
    expect(html).toBe(
      '<p>Use <span class="gt gt-val-on">Plot (<kbd>FE_ALT1</kbd>)</span> &amp; ' +
        '<span class="gt gt-earth">Ferrite</span></p><p>&lt;script&gt;</p>',
    );
  });
});

describe('search', () => {
  const mk = (id: string, en: string, pt: string): Item => ({
    id,
    cat: 'products',
    name: { en, pt },
    group: { en: '', pt: '' },
    icon: null,
    value: 0,
    currency: 'Credits',
    obtain: [],
  });
  const index = createIndex([
    mk('prod6', 'Metal Plating', 'Placa de metal'),
    mk('raw1', 'Carbon', 'Carbono'),
  ]);

  it('strips accents', () => expect(normalize('Refinária Açaí')).toBe('refinaria acai'));
  it('finds items in both languages', () => {
    expect(index.search('placa')[0]).toBe('prod6');
    expect(index.search('metal plating')[0]).toBe('prod6');
    expect(index.search('carbono')[0]).toBe('raw1');
  });
});
