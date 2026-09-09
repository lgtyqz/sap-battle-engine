import { describe, expect, it } from 'vitest';
import { optimizeFight } from '../src/index';
import { runFightOptimizer } from '../src/optimizer/optimizer';
import type { SimulationConfig, SimulationResult } from '../src/index';
const config = { playerPets: [{name:'Fish', attack:20, health:20}], opponentPets: [{name:'Fish', attack:1, health:1}], simulationCount:1 } as SimulationConfig;
describe('fight optimizer integration', () => {
  it('runs real battles reproducibly without mutating inputs', () => {
    const before = structuredClone(config);
    const a = optimizeFight(config, {seed:42});
    const b = optimizeFight(config, {seed:42});
    expect({...a, stats:{...a.stats, elapsedMs:0}}).toEqual({...b, stats:{...b.stats, elapsedMs:0}});
    expect(config).toEqual(before);
    expect(a.termination).toBe('no-sampled-counter');
    expect(a.unbeatenSide).toBe('player');
    expect(a.stats.simulations).toBeLessThan(a.stats.potentialMatchups * 15);
    expect(a.stats.cacheHits).toBeGreaterThan(0);
    a.finalPosition.playerPets[0]!.attack = 999;
    expect(config).toEqual(before);
  });
  it('honors exact budgets and publishes no incomplete response', () => {
    const result = optimizeFight(config, {maxSimulations:7});
    expect(result.stats.simulations).toBe(7);
    expect(result.termination).toBe('simulation-budget');
    expect(result.steps).toHaveLength(0);
  });
  it('supports cancellation from progress and independent nested runs', () => {
    let stop = false;
    const result = optimizeFight(config, {shouldAbort:()=>stop, onProgress:()=>{
      expect(optimizeFight(config, {maxSimulations:0}).stats.simulations).toBe(0);
      stop = true;
    }});
    expect(result.termination).toBe('cancelled');
    expect(result.stats.simulations).toBe(15);
    expect(optimizeFight(config).unbeatenSide).toBe('player');
  });
  it('extends mixed pairs by 35 samples and reuses cached estimates', () => {
    const batches:number[] = [];
    const result = runFightOptimizer(config, {maxResponseSteps:4}, (battle) => {
      batches.push(battle.simulationCount);
      expect(battle.logsEnabled).toBe(false);
      expect(battle.captureRandomDecisions).toBe(false);
      const n = battle.simulationCount;
      return {playerWins:Math.floor(n/2), opponentWins:n-Math.floor(n/2), draws:0} as SimulationResult;
    });
    expect(batches).toContain(35);
    expect(batches.every(n=>n===15 || n===35)).toBe(true);
    expect(result.matchups.every(m=>m.simulations<=50)).toBe(true);
    expect(result.stats.cacheHits).toBeGreaterThan(0);
  });
  it('validates controls and rejects battle-specific overrides', () => {
    expect(()=>optimizeFight(config,{initialSimulations:0})).toThrow();
    expect(()=>optimizeFight(config,{refinementSimulations:14})).toThrow();
    expect(()=>optimizeFight({...config, randomDrawOverrides:[]})).toThrow(/overrides/);
  });
});
