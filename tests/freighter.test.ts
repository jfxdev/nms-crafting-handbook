// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  corridorShape,
  counts,
  decodePlan,
  emptyPlan,
  encodePlan,
  freighterKindOf,
  issues,
  key,
  links,
  reachable,
  type FreighterKind,
} from '../src/lib/freighter.ts';

const KINDS: Record<string, FreighterKind> = {
  cor: 'corridor',
  room: 'room',
  up: 'stairs',
};
const kindOf = (id: string) => KINDS[id];

/** Builds a plan from rows of one-letter cells per deck: c = corridor, r = room, s = stairs. */
function plan(decks: Record<number, string[]>) {
  const p = emptyPlan(5, 5);
  const zs = Object.keys(decks).map(Number);
  p.decks = [Math.min(...zs), Math.max(...zs)];
  p.entrance = { x: 0, y: 0, z: 0 };
  const ids: Record<string, string> = { c: 'cor', r: 'room', s: 'up' };
  for (const [z, rows] of Object.entries(decks)) {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ids[ch]) p.cells[key({ x, y, z: Number(z) })] = ids[ch];
      }),
    );
  }
  return p;
}

describe('freighter planner', () => {
  it('classifies NMSE building ids', () => {
    expect(freighterKindOf('FRE_CORR_A')).toBe('corridor');
    expect(freighterKindOf('FRE_ROOM_REFINE')).toBe('room');
    expect(freighterKindOf('FRE_ROOM_LADDER')).toBe('stairs');
    expect(freighterKindOf('FRE_EXT_WALKWAY')).toBe('exterior');
    expect(freighterKindOf('FRE_FACE_DOOR_A')).toBeUndefined();
    expect(freighterKindOf('CORRIDOR_SPACE')).toBeUndefined();
  });

  it('shapes corridors from their neighbours like the game', () => {
    const p = plan({ 0: ['ccc', '.c.', '.c.'] });
    const at = (x: number, y: number) => corridorShape(links(p, { x, y, z: 0 }));
    expect(at(0, 0)).toBe('end');
    expect(at(1, 0)).toBe('t');
    expect(at(1, 1)).toBe('straight');
    expect(corridorShape([true, true, false, false])).toBe('corner');
    expect(corridorShape([true, true, true, true])).toBe('cross');
  });

  it('walks up stairs and flags disconnected modules', () => {
    const p = plan({ 0: ['cs', '', '..r'], 1: ['.r'] });
    const ok = reachable(p, kindOf);
    expect(ok.has('1,0,1')).toBe(true);
    expect(ok.has('2,2,0')).toBe(false);
    expect(issues(p, kindOf)).toEqual([{ type: 'unreachable', at: { x: 2, y: 2, z: 0 } }]);
  });

  it('reports stairs that lead nowhere and an empty entrance', () => {
    const p = plan({ 0: ['cs'] });
    expect(issues(p, kindOf).map((i) => i.type)).toEqual(['stairsNowhere']);
    p.entrance = { x: 4, y: 4, z: 0 };
    expect(issues(p, kindOf).map((i) => i.type)).toContain('noEntrance');
  });

  it('round-trips plans through the share code and rejects junk', () => {
    const p = plan({ '-1': ['r'], 0: ['cc', '.r'] });
    const code = encodePlan(p);
    expect(code).toMatch(/^1\.[\w-]+$/);
    expect(decodePlan(code, () => true)).toEqual(p);
    expect(counts(decodePlan(code, (id) => id !== 'room')!)).toEqual(new Map([['cor', 2]]));
    expect(decodePlan('1.not-base64!', () => true)).toBeUndefined();
    expect(decodePlan('2.abc', () => true)).toBeUndefined();
  });
});
