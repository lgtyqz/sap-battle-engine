import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createBattleEngine, type RandomDraw, type SimulationConfig } from '../src/index';
import { align } from './support/bug-squisher-alignment.mjs';

const fixtureRoot = fileURLToPath(new URL('./bug-squisher-fixtures/', import.meta.url));

function discoverFixtures(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? discoverFixtures(path) : entry.isFile() && entry.name.endsWith('.json') ? [path] : [];
  }).sort();
}

function captureCompleteTape(config: SimulationConfig, recordedTape: readonly RandomDraw[]) {
  const recordedShuffleDraws = recordedTape
    .filter((draw) => draw.stream === 'shuffle')
    .map((draw) => draw.value);
  let shuffleCursor = 0;
  const engine = createBattleEngine({
    entropy: () => {
      const value = recordedShuffleDraws[shuffleCursor++];
      if (value == null) {
        throw new Error('Fixture is missing a required shuffle draw');
      }
      return value;
    },
  });
  const result = engine.runSimulation({
    ...config,
    randomDrawOverrides: undefined,
    simulationCount: 1,
    logsEnabled: true,
    maxLoggedBattles: 1,
    captureRandomDraws: true,
    captureRandomDecisions: true,
    optimizeDeterministicSimulations: false,
    strictRandomOverrideValidation: true,
  });
  const completeTape = result.randomDraws ?? [];
  const sharedLength = Math.min(recordedTape.length, completeTape.length);

  expect(
    completeTape.slice(0, sharedLength),
    'Recorded random tape is incompatible with the fixture seed',
  ).toEqual(recordedTape.slice(0, sharedLength));

  return completeTape;
}

describe('Bug Squisher regression fixtures', () => {
  const files = discoverFixtures(fixtureRoot);

  for (const file of files) {
    it(relative(fixtureRoot, file), () => {
      // Parse inside the test so a malformed file does not prevent other cases running.
      const fixture = JSON.parse(readFileSync(file, 'utf8'));
      expect(fixture.schemaVersion, 'Unsupported fixture schema').toBe(1);
      expect(fixture.reference, 'Fixture needs browser observations').toBeTruthy();
      expect(fixture.reference.inputHash, 'Fixture/reference input hash mismatch').toBe(fixture.metadata.inputHash);
      expect(Array.isArray(fixture.config.randomDrawOverrides), 'Fixture needs its recorded RNG tape').toBe(true);

      // Captures can stop immediately after the last browser observation, while
      // the engine still needs deterministic draws to emit its terminal events.
      // Reconstruct that tail from the fixture seed, verify the recorded portion,
      // then strictly replay the complete one-battle tape.
      const completeTape = captureCompleteTape(
        fixture.config,
        fixture.config.randomDrawOverrides,
      );
      const engine = createBattleEngine({ entropy: () => { throw new Error('Fixture exhausted recorded randomness'); } });
      const result = engine.runSimulation({
        ...fixture.config,
        randomDrawOverrides: completeTape,
        simulationCount: 1,
        logsEnabled: true,
        maxLoggedBattles: 1,
        captureRandomDraws: true,
        captureRandomDecisions: true,
        optimizeDeterministicSimulations: false,
        strictRandomOverrideValidation: true,
      });
      expect(result.randomOverrideError).toBeFalsy();
      expect(result.battles).toBeDefined();
      expect(result.battles).toHaveLength(1);
      let battle;
      if(result.battles){
        battle = result.battles[0];
        expect(battle.logs.length, 'Engine returned no structured events').toBeGreaterThan(0);
      const alignment = align(fixture.reference, battle.logs);
      expect(alignment.matches.length, JSON.stringify(alignment, null, 2)).toBe(fixture.reference.checkpoints.length);
      }

      // Incomplete captures still assert every accepted observation. Missing frames
      // and reported input outcomes must never become invented expectations.
      const outcome = fixture.reference.outcome;
      if (outcome != null) {
        expect(['player', 'opponent', 'draw']).toContain(outcome.winner);
        expect(outcome.evidence?.frame, 'Observed winner needs browser evidence').toBeTruthy();
        switch(outcome.winner){
          case "player":
            expect(result.playerWins).toBeGreaterThan(0);
            break;
          case "opponent":
            expect(result.opponentWins).toBeGreaterThan(0);
            break;
          case "draw":
            expect(result.draws).toBeGreaterThan(0);
            break;
        }
      }
    });
  }
});
