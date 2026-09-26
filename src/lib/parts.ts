// SPDX-License-Identifier: GPL-3.0-or-later
// Starship / corvette part classes and slots, shared by the catalog builder and the ship builder UI.
import type { Localized, Part, PartKind } from './types.ts';

export interface Placement {
  /** Centre of the icon, in % of the preview stage (nose points up). */
  x: number;
  y: number;
  /** Icon size, in % of the stage width. */
  size: number;
  /** Mirror horizontally (right-hand wing, etc). */
  flip?: boolean;
  rotate?: number;
  /** Drawn behind the other parts. */
  back?: boolean;
}

export interface SlotDef {
  key: string;
  label: Localized;
  /** Where the part is drawn in the preview; empty = interior part, listed below the stage. */
  place: Placement[];
}

export interface ClassDef {
  key: string;
  kind: PartKind;
  label: Localized;
  slots: SlotDef[];
}

const WINGS: Placement[] = [
  { x: 27, y: 52, size: 30, back: true },
  { x: 73, y: 52, size: 30, flip: true, back: true },
];
const ENGINES: Placement[] = [
  { x: 42, y: 80, size: 16 },
  { x: 58, y: 80, size: 16, flip: true },
];
const slot = (key: string, en: string, pt: string, place: Placement[]): SlotDef => ({
  key,
  label: { en, pt },
  place,
});

export const CLASSES: ClassDef[] = [
  {
    key: 'fighter',
    kind: 'starship',
    label: { en: 'Fighter', pt: 'Caça' },
    slots: [
      slot('cockpit', 'Fuselage & cockpit', 'Fuselagem e cockpit', [{ x: 50, y: 40, size: 30 }]),
      slot('wings', 'Wings', 'Asas', WINGS),
      slot('engines', 'Engines', 'Motores', ENGINES),
    ],
  },
  {
    key: 'hauler',
    kind: 'starship',
    label: { en: 'Hauler', pt: 'Transportador' },
    slots: [
      slot('cockpit', 'Cockpit', 'Cockpit', [{ x: 50, y: 30, size: 26 }]),
      slot('wings', 'Wings', 'Asas', WINGS),
      slot('engines', 'Engines', 'Motores', ENGINES),
    ],
  },
  {
    key: 'explorer',
    kind: 'starship',
    label: { en: 'Explorer', pt: 'Explorador' },
    slots: [
      slot('cockpit', 'Hull & cockpit', 'Casco e cockpit', [{ x: 50, y: 42, size: 32 }]),
      slot('wings', 'Wings', 'Asas', WINGS),
    ],
  },
  {
    key: 'solar',
    kind: 'starship',
    label: { en: 'Solar', pt: 'Solar' },
    slots: [
      slot('cockpit', 'Fuselage', 'Fuselagem', [{ x: 50, y: 42, size: 28 }]),
      slot('wings', 'Wings', 'Asas', WINGS),
      slot('sails', 'Solar sails', 'Velas solares', [{ x: 50, y: 62, size: 56, back: true }]),
    ],
  },
  {
    // Slot names follow the game's "Corvette Modules" tech tree (AssistantNMS TechTree, en/pt-br).
    key: 'corvette',
    kind: 'corvette',
    label: { en: 'Corvette', pt: 'Corveta' },
    slots: [
      slot('cockpit', 'Cockpit', 'Cockpit', [{ x: 50, y: 14, size: 18 }]),
      slot('habitation', 'Habitation Modules', 'Módulos de habitação', [
        { x: 50, y: 35, size: 20 },
        { x: 50, y: 55, size: 20 },
      ]),
      slot('hull', 'Hull Plating', 'Chapeamento da fuselagem', [
        { x: 31, y: 45, size: 14 },
        { x: 69, y: 45, size: 14, flip: true },
      ]),
      slot('wings', 'Wings', 'Asas', [
        { x: 13, y: 50, size: 20, back: true },
        { x: 87, y: 50, size: 20, flip: true, back: true },
      ]),
      slot('reactors', 'Reactors', 'Reatores', [
        { x: 40, y: 86, size: 13 },
        { x: 60, y: 86, size: 13, flip: true },
      ]),
      slot('additional', 'Additional Modules', 'Módulos adicionais', [{ x: 50, y: 72, size: 12 }]),
      slot('furnishings', 'Furnishings and Utilities', 'Mobiliário e utilidades', []),
      slot('interior', 'Internal Configuration', 'Configuração interna', []),
    ],
  },
];

export const classDef = (key: string): ClassDef | undefined => CLASSES.find((c) => c.key === key);

export const isValidPart = (p: Part): boolean =>
  !!classDef(p.cls)?.slots.some((s) => s.key === p.slot) && classDef(p.cls)!.kind === p.kind;

const SLOT_WORDS: [RegExp, string][] = [
  [/solar sails/, 'sails'],
  [/engines/, 'engines'],
  [/wings/, 'wings'],
  [/fuselage|cockpit/, 'cockpit'],
];

/**
 * Classifies an upstream starship component from its English group and description, e.g.
 * group "Fighter Starship Component" + "...determines the style and position of the ship's
 * <STELLAR>wings<>." -> { kind: starship, cls: fighter, slot: wings }.
 */
export function starshipPartOf(group: string, description: string): Part | undefined {
  const m = /^(\w+) Starship Component$/.exec(group);
  const cls = m?.[1]?.toLowerCase();
  if (!cls || classDef(cls)?.kind !== 'starship') return undefined;
  const pos = /position of the ship's (.*?)\./.exec(description)?.[1]?.toLowerCase() ?? '';
  const found = SLOT_WORDS.find(([re]) => re.test(pos));
  return found ? { kind: 'starship', cls, slot: found[1] } : undefined;
}
