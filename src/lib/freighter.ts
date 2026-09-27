// SPDX-License-Identifier: GPL-3.0-or-later
// Freighter base planner: module kinds (shared with the NMSE import) and the plan model.
//
// The game builds freighter bases on a cell grid: every corridor, room or staircase takes one cell,
// corridors reshape themselves to join their neighbours, and stairs lead to the deck above. The
// planner mirrors that logic on a top-down grid; it does not reproduce each freighter's exact hull.

export type FreighterKind = 'corridor' | 'room' | 'stairs' | 'exterior';

/** NMSE building ids used by the planner (the current system; legacy *_SPACE parts are left out). */
const KINDS: Record<string, FreighterKind> = {
  FRE_CORR_A: 'corridor',
  FRE_CORR_A_GLAS: 'corridor',
  FRE_CORR_B: 'corridor',
  FRE_CORR_STA: 'stairs',
  FRE_CORR_G_STA: 'stairs',
  FRE_CORR_STA_B: 'stairs',
  FRE_ROOM_LADDER: 'stairs',
  FRE_EXT_W_STA: 'stairs',
  FRE_EXT_PLATFOR: 'exterior',
  FRE_EXT_WALKWAY: 'exterior',
};

export function freighterKindOf(nmseId: string): FreighterKind | undefined {
  return KINDS[nmseId] ?? (/^FRE_ROOM_/.test(nmseId) ? 'room' : undefined);
}

export const KIND_ORDER: FreighterKind[] = ['corridor', 'room', 'stairs', 'exterior'];

// ---------------------------------------------------------------------------------------------
// Plan

export interface Pos {
  x: number;
  y: number;
  /** Deck: 0 is the bridge deck, positive decks are above it, negative below. */
  z: number;
}

export interface Plan {
  /** Grid width (port -> starboard) and length (bow -> stern), in cells. */
  w: number;
  h: number;
  /** Lowest and highest deck shown. */
  decks: [number, number];
  /** Where the base joins the bridge; reachability starts here. */
  entrance: Pos;
  /** "x,y,z" -> catalog item id. */
  cells: Record<string, string>;
}

export const LIMITS = { minSize: 4, maxSize: 40, maxDecks: 9 } as const;

export const key = (p: Pos): string => `${p.x},${p.y},${p.z}`;
export function parseKey(k: string): Pos {
  const [x, y, z] = k.split(',').map(Number) as [number, number, number];
  return { x, y, z };
}

export function emptyPlan(w = 11, h = 15): Plan {
  return { w, h, decks: [0, 0], entrance: { x: Math.floor(w / 2), y: 0, z: 0 }, cells: {} };
}

export const inBounds = (plan: Plan, p: Pos): boolean =>
  p.x >= 0 &&
  p.y >= 0 &&
  p.x < plan.w &&
  p.y < plan.h &&
  p.z >= plan.decks[0] &&
  p.z <= plan.decks[1];

/** Directions in the order N, E, S, W (N = towards the bow / bridge). */
export const DIRS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
] as const;

export type KindOf = (itemId: string) => FreighterKind | undefined;

/** Which of the 4 horizontal neighbours this cell opens into (a module on both sides). */
export function links(plan: Plan, p: Pos): boolean[] {
  if (!plan.cells[key(p)]) return [false, false, false, false];
  return DIRS.map(({ dx, dy }) => !!plan.cells[key({ x: p.x + dx, y: p.y + dy, z: p.z })]);
}

export type CorridorShape = 'single' | 'end' | 'straight' | 'corner' | 't' | 'cross';

/** The shape a corridor takes given its links (the game picks the piece automatically). */
export function corridorShape(l: boolean[]): CorridorShape {
  const n = l.filter(Boolean).length;
  if (n === 0) return 'single';
  if (n === 1) return 'end';
  if (n === 2) return (l[0] && l[2]) || (l[1] && l[3]) ? 'straight' : 'corner';
  return n === 3 ? 't' : 'cross';
}

/** Stairs (and ladders) lead from their cell to the same cell on the deck above. */
export const above = (p: Pos): Pos => ({ ...p, z: p.z + 1 });

/** Cells reachable from the entrance, walking between neighbours and up/down stairs. */
export function reachable(plan: Plan, kindOf: KindOf): Set<string> {
  const seen = new Set<string>();
  const start = key(plan.entrance);
  if (!plan.cells[start]) return seen;
  const queue = [plan.entrance];
  seen.add(start);
  const visit = (p: Pos) => {
    const k = key(p);
    if (!seen.has(k) && plan.cells[k]) {
      seen.add(k);
      queue.push(p);
    }
  };
  while (queue.length) {
    const p = queue.shift()!;
    for (const { dx, dy } of DIRS) visit({ x: p.x + dx, y: p.y + dy, z: p.z });
    if (kindOf(plan.cells[key(p)]!) === 'stairs') visit(above(p));
    const below = { ...p, z: p.z - 1 };
    const b = plan.cells[key(below)];
    if (b && kindOf(b) === 'stairs') visit(below);
  }
  return seen;
}

export interface Issue {
  type: 'unreachable' | 'stairsNowhere' | 'noEntrance';
  at?: Pos;
}

export function issues(plan: Plan, kindOf: KindOf): Issue[] {
  const out: Issue[] = [];
  const keys = Object.keys(plan.cells);
  if (!keys.length) return out;
  if (!plan.cells[key(plan.entrance)]) out.push({ type: 'noEntrance', at: plan.entrance });
  else {
    const ok = reachable(plan, kindOf);
    for (const k of keys) if (!ok.has(k)) out.push({ type: 'unreachable', at: parseKey(k) });
  }
  for (const k of keys) {
    const p = parseKey(k);
    if (kindOf(plan.cells[k]!) === 'stairs' && !plan.cells[key(above(p))])
      out.push({ type: 'stairsNowhere', at: p });
  }
  return out;
}

/** Module id -> how many are placed. */
export function counts(plan: Plan): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of Object.values(plan.cells)) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

// ---------------------------------------------------------------------------------------------
// Sharing: compact, URL-safe encoding ("1." + base64url JSON).

interface Wire {
  w: number;
  h: number;
  d: [number, number];
  e: [number, number, number];
  m: string[];
  c: number[];
}

export function encodePlan(plan: Plan): string {
  const ids = [...new Set(Object.values(plan.cells))].sort();
  const c: number[] = [];
  for (const [k, id] of Object.entries(plan.cells).sort(([a], [b]) => a.localeCompare(b))) {
    const p = parseKey(k);
    c.push(p.x, p.y, p.z, ids.indexOf(id));
  }
  const wire: Wire = {
    w: plan.w,
    h: plan.h,
    d: plan.decks,
    e: [plan.entrance.x, plan.entrance.y, plan.entrance.z],
    m: ids,
    c,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(wire));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `1.${btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

const int = (v: unknown, min: number, max: number): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw new Error('bad');
  return v;
};

/** Parses a shared plan; returns undefined for anything malformed. Unknown modules are dropped. */
export function decodePlan(s: string, known: (id: string) => boolean): Plan | undefined {
  try {
    if (!s.startsWith('1.')) return undefined;
    const b64 = s.slice(2).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const wire = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))),
    ) as Wire;
    const { minSize, maxSize, maxDecks } = LIMITS;
    const w = int(wire.w, minSize, maxSize);
    const h = int(wire.h, minSize, maxSize);
    const lo = int(wire.d[0], -maxDecks, maxDecks);
    const hi = int(wire.d[1], lo, lo + maxDecks - 1);
    const plan: Plan = {
      w,
      h,
      decks: [lo, hi],
      entrance: {
        x: int(wire.e[0], 0, w - 1),
        y: int(wire.e[1], 0, h - 1),
        z: int(wire.e[2], lo, hi),
      },
      cells: {},
    };
    if (!Array.isArray(wire.m) || !Array.isArray(wire.c) || wire.c.length % 4) return undefined;
    for (let i = 0; i < wire.c.length; i += 4) {
      const [x, y, z, mi] = wire.c.slice(i, i + 4) as [number, number, number, number];
      const id = wire.m[mi];
      const p = { x, y, z };
      if (typeof id === 'string' && known(id) && inBounds(plan, p)) plan.cells[key(p)] = id;
    }
    return plan;
  } catch {
    return undefined;
  }
}
