import type { BattleEvent, BoardSnapshot } from '../../../events';
export interface Battle { logs: BattleEvent[]; winner: 'opponent' | 'player' | 'draw'; finalBoard?: BoardSnapshot; }
