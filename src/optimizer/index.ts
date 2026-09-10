import { createBattleEngine } from '../index';
import { runFightOptimizer } from './optimizer';
import type { SimulationConfig } from '../app/domain/interfaces/simulation-config.interface';
import type { FightOptimizerOptions, FightOptimizerResult } from './types';
/** Find the alternating sampled best-response chain for both sides of a battle. */
export function optimizeFight(config: SimulationConfig, options: FightOptimizerOptions = {}): FightOptimizerResult {
  let entropy: () => number;
  // A single engine and explicit entropy source serve all cached pairs. With seed
  // null, main draws and legacy Lodash shuffle draws both use this controlled stream.
  const engine = createBattleEngine({entropy: () => entropy()});
  return runFightOptimizer(config, options, (battle, random, shouldAbort) => {
    entropy = random;
    return engine.runHeadlessSimulation(battle, {}, {shouldAbort});
  }, (baseConfig, side, lineup) => engine.projectLineupAfterEndTurn(baseConfig, side, lineup));
}
export { generatePositionings, getPetPositioningHint } from './positionings';
export type { FightOptimizerOptions, FightOptimizerResult, Lineup, Positioning, MatchupEstimate, ResponseStep, OptimizerProgress, OptimizerSide, PetPositioningHint } from './types';
