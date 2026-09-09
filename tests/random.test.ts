import { describe, it, expect } from 'vitest';
import { RandomSource } from '../src/app/runtime/random-decision-state';
const request = { key: 'repeat', label: 'same label', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] };
describe('upstream random decision semantics', () => {
  it('matches fingerprints before indexes and repeats fingerprint overrides', () => {
    const r = new RandomSource(() => 0); r.startRandomDecisionSession({ capture: true, overrides: [{ index: 0, optionId: 'a' }, { index: 8, key: 'repeat', label: 'same label', optionId: 'b' }] });
    for (let i = 0; i < 2; i++)expect(r.chooseRandomOption(request, () => 0)).toMatchObject({ index: 1, forced: true });
    expect(r.finishRandomDecisionSession().decisions.map(d => d.index)).toEqual([0, 1]);
  });
  it('preserves zero/one-option draw behavior and legacy single-option consumption', () => {
    const r = new RandomSource(); let draws = 0; const roll = () => { draws++; return 0; }; r.startRandomDecisionSession({ capture: true });
    expect(r.chooseRandomOption({ ...request, options: [] }, roll).index).toBe(-1);
    expect(r.chooseRandomOption({ ...request, options: [request.options[0]] }, roll).index).toBe(0); expect(draws).toBe(0);
    r.chooseLegacyRandomOption({ ...request, options: [request.options[0]] }, roll); expect(draws).toBe(1);
    expect(r.finishRandomDecisionSession().decisions).toEqual([]);
  });
  it('rejects invalid random tape values', () => {
    const r = new RandomSource(); r.begin(1, false, [{ stream: 'seeded', value: 1 }]); expect(() => r.getRandomFloat()).toThrow('[0, 1)');
  });
});
