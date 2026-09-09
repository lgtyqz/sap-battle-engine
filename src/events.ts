/** Plain, immutable-by-convention records. No runtime entities escape the engine. */
export type Side = 'player' | 'opponent';
export interface PetSnapshot {
  id: string;
  side: Side;
  position: number;
  name: string;
  /** Legacy log sources sometimes contain only a name. */
  attack?: number;
  health?: number;
  exp: number;
  mana: number;
  equipment: string | null;
  equipmentUses: number | null;
}
export interface BoardSnapshot { player: (PetSnapshot | null)[]; opponent: (PetSnapshot | null)[]; }
export interface BattleEvent {
  sequence: number;
  battle: number;
  type: 'attack' | 'move' | 'board' | 'death' | 'ability' | 'equipment' | 'trumpets';
  message: string;
  side?: Side;
  source?: PetSnapshot;
  target?: PetSnapshot;
  sourceIndex?: number;
  targetIndex?: number;
  targetSide?: Side;
  randomEvent?: boolean;
  randomEventReason?: 'deterministic' | 'tie-broken' | 'true-random';
  tiger?: boolean;
  puma?: boolean;
  pteranodon?: boolean;
  pantherMultiplier?: number;
  count?: number;
  bold?: boolean;
  noCollapse?: boolean;
  /** State at event emission; consecutive records expose the corresponding changes. */
  board: BoardSnapshot;
}
/** Upstream uses an independent entropy stream for Lodash shuffles. */
export interface RandomDraw { stream: 'seeded' | 'shuffle'; value: number; }
