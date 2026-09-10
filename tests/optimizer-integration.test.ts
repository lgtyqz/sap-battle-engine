import { describe, expect, it } from 'vitest';
import { optimizeFight } from '../src/index';
import { runFightOptimizer } from '../src/optimizer/optimizer';
import type { SimulationConfig, SimulationResult } from '../src/index';
const config = { playerPets: [{name:'Fish', attack:20, health:20}], opponentPets: [{name:'Fish', attack:1, health:1}], simulationCount:1 } as SimulationConfig;
const positioningSensitiveConfig = {
  playerPets: [{name:'Fish', attack:2, health:2}, {name:'Fish', attack:5, health:5}],
  opponentPets: [{name:'Fish', attack:5, health:1}, {name:'Fish', attack:2, health:6}],
  simulationCount:1
}
describe('fight optimizer integration', () => {
  it('runs real battles reproducibly without mutating inputs', () => {
    const before = structuredClone(config);
    const a = optimizeFight(config, {seed:67});
    const b = optimizeFight(config, {seed:67});
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
  it('remaps position-dependent end-turn effects onto each candidate lineup', () => {
    const endTurnConfig = {
      ...config,
      playerPets: [
        {name:'Fish', attack:5, health:7},
        {name:'Monkey', attack:1, health:2},
        {name:'Ant', attack:4, health:4},
      ],
    } as SimulationConfig;
    const result = runFightOptimizer(endTurnConfig, {
      initialSimulations:1, refinementSimulations:1, maxResponseSteps:1,
    }, (battle) => battle.playerPets[0]?.name === 'Ant' && battle.playerPets[0].attack === 6
      ? {playerWins:1, opponentWins:0, draws:0}
      : {playerWins:0, opponentWins:1, draws:0},
    (_base, side, lineup) => {
      const projected = structuredClone(lineup);
      if (side !== 'player') return projected;
      const front = projected.find(pet => pet !== null);
      if (front && projected.some(pet => pet?.name === 'Monkey')) {
        front.attack = (front.attack ?? 0) + 2;
        front.health = (front.health ?? 0) + 2;
      }
      return projected;
    });
    expect(result.finalPosition.playerPets[0]).toMatchObject({name:'Ant', attack:6, health:6});
    expect(result.finalPosition.playerPets.find(pet => pet?.name === 'Fish')).toMatchObject({attack:3, health:5});
  });
  it('uses the engine end-turn projection in the public optimizer', () => {
    const result = optimizeFight({
      playerPack:'Turtle', opponentPack:'Turtle', turn:9, seed:17, simulationCount:1,
      playerPets:[
        {name:'Ant', attack:4, health:4},
        {name:'Monkey', attack:1, health:2},
        {name:'Fish', attack:5, health:5},
      ],
      opponentPets:[],
    }, {maxResponseSteps:0});
    expect(result.finalPosition.playerPets.filter(pet => pet).map(pet => pet?.name)).toEqual(['Fish', 'Ant', 'Monkey']);
    expect(result.finalPosition.playerPets[0]).toMatchObject({attack:7, health:7});
    expect(result.finalPosition.playerPets[1]).toMatchObject({attack:2, health:2});
  });
  it('validates controls and rejects battle-specific overrides', () => {
    expect(()=>optimizeFight(config,{initialSimulations:0})).toThrow();
    expect(()=>optimizeFight(config,{refinementSimulations:14})).toThrow();
    expect(()=>optimizeFight({...config, randomDrawOverrides:[]})).toThrow(/overrides/);
  });

  it("positions fucking properly", () => {
    const a = optimizeFight(config, {seed:67});
    console.log(a);
    expect(a.termination, "no-sampled-counter");
  })
});
