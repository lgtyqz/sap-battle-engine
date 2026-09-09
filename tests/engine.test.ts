import { describe, it, expect } from 'vitest';
import { createBattleEngine, runSimulation, catalogs, UPSTREAM_REVISION, type SimulationConfig } from '../src/index';
const config: SimulationConfig = {
playerPack: 'Turtle', opponentPack: 'Turtle', turn: 5, seed: 17, simulationCount: 3, logsEnabled: true, captureRandomDecisions: true, captureRandomDraws: true,
  playerPets: [{ name: 'Mosquito', attack: 3, health: 5 }, { name: 'Ant', attack: 3, health: 2 }, { name: 'Cricket', attack: 2, health: 3 }],
  opponentPets: [{ name: 'Pig', attack: 4, health: 5 }, { name: 'Fish', attack: 5, health: 5 }, { name: 'Otter', attack: 3, health: 4 }]
};
const engine = () => createBattleEngine({ entropy: () => 0.375 });
describe('isolated library API', () => {
  it('reuses an engine without mutating inputs or previous results', () => {
    const e = engine(), input = structuredClone(config), original = structuredClone(input);
    const first = e.runSimulation(input), snapshot = structuredClone(first);
    expect(e.runSimulation(input)).toEqual(first);
    e.runSimulation({ ...input, seed: 0, playerPets: [], simulationCount: 1 });
    expect(first).toEqual(snapshot); expect(input).toEqual(original);
  });
  it('does not patch Math.random and isolates engines and reentrant hooks', () => {
    const native = Math.random, e = engine(), other = engine(); const expected = other.runSimulation(config); let nested = 0;
    const actual = e.runSimulation(config, {
progressInterval: 1, onProgress() {
        expect(e.runSimulation({ ...config, simulationCount: 1 })).toEqual(other.runSimulation({ ...config, simulationCount: 1 })); nested++;
      }
});
    expect(actual).toEqual(expected); expect(nested).toBe(3); expect(Math.random).toBe(native);
  });
  it('captures and replays every draw including legacy shuffles', () => {
    const c = { ...config, playerToy: 'Dice Cup', playerToyLevel: 2 };
    const captured = engine().runSimulation(c);
    expect(captured.randomDraws.some(d => d.stream === 'shuffle')).toBe(true);
    const replay = createBattleEngine({ entropy: () => { throw Error('entropy must not be used'); } }).runSimulation({ ...c, seed: 999, randomDrawOverrides: captured.randomDraws });
    expect(replay).toEqual(captured);
  });
  it('preserves outcomes and draw order independently of logs and choice capture', () => {
    const e = engine(), on = e.runSimulation(config), off = e.runHeadlessSimulation({ ...config, logsEnabled: false, captureRandomDecisions: false });
    expect([off.playerWins, off.opponentWins, off.draws]).toEqual([on.playerWins, on.opponentWins, on.draws]);
    expect(off.randomDraws).toEqual(on.randomDraws); expect(off.randomDecisions).toEqual([]); expect(off.battles).toBeUndefined();
  });
  it('forces a choice while consuming the same number of draws for that choice', () => {
    const e = engine(), c = { ...config, simulationCount: 1 }, r = e.runSimulation(c), first = r.randomDecisions[0];
    expect(first.options.length).toBeGreaterThan(1);
    const optionId = first.options.find(o => o.id !== first.selectedOptionId)!.id;
    const forced = e.runSimulation({ ...c, randomDecisionOverrides: [{ index: first.index, optionId }] });
    expect(forced.randomDecisions[0]).toMatchObject({ selectedOptionId: optionId, forced: true });
    expect(forced.randomDraws.slice(0, 2)).toEqual(r.randomDraws.slice(0, 2));
  });
  it('recovers after strict override and tape errors, and preserves permissive override behavior', () => {
    const e = engine(), expected = e.runSimulation(config);
    expect(() => e.runSimulation({ ...config, randomDecisionOverrides: [{ index: 0, optionId: 'invalid' }] })).toThrow('Random override invalid');
    expect(e.runSimulation(config)).toEqual(expected);
    expect(() => e.runSimulation({ ...config, randomDrawOverrides: [] })).toThrow('Random tape mismatch');
    expect(e.runSimulation(config)).toEqual(expected);
    const permissive = e.runSimulation({ ...config, strictRandomOverrideValidation: false, randomDecisionOverrides: [{ index: 0, optionId: 'invalid' }] });
    expect(permissive).toEqual(expected);
  });
  it('returns progress and honors cancellation', () => {
    let completed = 0;
    const result = engine().runSimulation({ ...config, simulationCount: 10 }, { progressInterval: 1, onProgress: p => { completed = p.completed; }, shouldAbort: () => completed === 2 });
    expect(completed).toBe(2); expect(result.playerWins + result.opponentWins + result.draws).toBe(2);
  });
  it('exports serializable structured events with stable identities and snapshots', () => {
    const r = engine().runSimulation(config); expect(JSON.parse(JSON.stringify(r))).toEqual(r);
    for (const battle of r.battles) {
      expect(battle.finalBoard.player.length).toBe(5);
      battle.logs.forEach((event, i) => { expect(event.sequence).toBe(i); expect(event.message).not.toMatch(/<[^>]+>/); expect(event.board.player.length).toBe(5); });
    }
    expect(r.battles.flatMap(b => b.logs).some(e => e.source?.id && e.target?.id)).toBe(true);
  });
  it('exports immutable catalogs and an explicit revision', () => {
    expect(UPSTREAM_REVISION).toHaveLength(40); expect(Object.isFrozen(catalogs)).toBe(true);
    expect(Object.isFrozen(catalogs.pets)).toBe(true); expect(Object.keys(catalogs.pets).length).toBeGreaterThan(100);
  });
  it('keeps convenience defaults and headless inclusion controls', () => {
    const e = engine(); expect(e.runHeadlessSimulation(config, { includeBattles: true }).battles).toHaveLength(3);
    expect(runSimulation({ ...config, simulationCount: 1, logsEnabled: false }).playerWins).toBeGreaterThanOrEqual(0);
  });
});
