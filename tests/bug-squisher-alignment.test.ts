import { describe, expect, it } from 'vitest';
import { align, boardDiff } from './support/bug-squisher-alignment.mjs';

// Synthetic observations test the harness, not SAP mechanics.
const board = (attack: number) => ({ player: [{ name: 'Fish', attack, health: 3 }], opponent: [] });
const reference = (attacks: number[]) => ({
  schemaVersion: 1, inputHash: 'synthetic', complete: true,
  checkpoints: attacks.map((attack, timeMs) => ({
    timeMs, confidence: 1, evidence: { frame: `${timeMs}.png` }, board: board(attack),
  })),
});
const events = [1, 2, 3].map((attack, sequence) => ({ sequence, message: '', board: board(attack) }));

describe('Bug Squisher checkpoint comparison', () => {
  it('allows intermediate emissions and repeated stable observations', () => {
    expect(align(reference([1, 1, 3]), events).status).toBe('observed-checkpoints-match');
  });

  it('rejects observations that move backwards through the battle', () => {
    expect(align(reference([3, 1]), events)).toMatchObject({ status: 'divergence-candidate', checkpoint: 1 });
  });

  it('compares only observed fields, ignores dead pets, and derives levels from experience', () => {
    const observed = { player: [{ ...board(1).player[0], level: 2 }], opponent: [] };
    const actual = { player: [null, { name: 'Ant', health: 0 }, { ...board(1).player[0], exp: 2, mana: 5 }], opponent: [] };
    expect(boardDiff(observed, actual)).toEqual([]);
    expect(boardDiff({ ...observed, player: [{ ...observed.player[0], equipment: null }] }, actual)).toHaveLength(1);
  });

  it('does not count low-confidence observations as matched', () => {
    const input = reference([1]);
    input.checkpoints[0].confidence = 0.5;
    expect(align(input, events)).toMatchObject({ status: 'inconclusive', matches: [] });
  });

  it('honors explicit phase and sequence restrictions', () => {
    const input = reference([1]);
    Object.assign(input.checkpoints[0], { engineSequence: 2 });
    expect(align(input, events).status).toBe('divergence-candidate');
    Object.assign(input.checkpoints[0], { engineSequence: 0, phase: 'after-start' });
    expect(align(input, events).status).toBe('divergence-candidate');
    expect(align(input, [{ ...events[0], message: 'Phase 3: After Start of Battle' }]).status).toBe('observed-checkpoints-match');
  });

  it('rejects empty references and preserves incomplete coverage', () => {
    expect(() => align(reference([]), events)).toThrow('nonempty checkpoints');
    expect(align({ ...reference([1]), complete: false }, events)).toMatchObject({
      status: 'inconclusive', reason: 'capture is incomplete', matches: [{ checkpoint: 0, eventSequences: [0] }],
    });
  });
});
