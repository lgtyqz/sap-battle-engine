import type { PetConfig, SimulationConfig } from '../app/domain/interfaces/simulation-config.interface';
import { normalizeLineup } from './positionings';
import type { Lineup, OptimizerSide, Positioning } from './types';

export type EndTurnProjector = (
  baseConfig: SimulationConfig,
  side: OptimizerSide,
  lineup: Lineup,
) => Lineup;

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function numericDelta(before: PetConfig | null, after: PetConfig | null): Record<string, number> {
  if (!before || !after) return {};
  const beforeRecord = before as unknown as Record<string, unknown>;
  const afterRecord = after as unknown as Record<string, unknown>;
  const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);
  const delta: Record<string, number> = {};
  for (const key of keys) {
    const beforeValue = finiteNumber(beforeRecord[key]);
    const afterValue = finiteNumber(afterRecord[key]);
    if (beforeValue === null && afterValue === null) continue;
    const difference = (afterValue ?? 0) - (beforeValue ?? 0);
    if (difference !== 0) delta[key] = difference;
  }
  return delta;
}

function lineupDeltas(before: Lineup, after: Lineup): Record<string, number>[] {
  return before.map((pet, index) => numericDelta(pet, after[index] ?? null));
}

/** Reassign end-turn numeric effects from the current order to each candidate order. */
export function createEndTurnLineupResolver(
  baseConfig: SimulationConfig,
  side: OptimizerSide,
  sourceLineup: Lineup,
  project: EndTurnProjector,
): (position: Positioning) => Lineup {
  let baselineDeltas: Record<string, number>[] | undefined;
  const cache = new Map<number, Lineup>();
  return (position) => {
    const cached = cache.get(position.id);
    if (cached) return cached;
    baselineDeltas ??= lineupDeltas(
      sourceLineup,
      normalizeLineup(project(baseConfig, side, sourceLineup)),
    );
    const candidate = position.order.map(slot => sourceLineup[slot]);
    const candidateDeltas = lineupDeltas(
      candidate,
      normalizeLineup(project(baseConfig, side, candidate)),
    );
    const projected = candidate.map((pet, targetIndex) => {
      if (!pet) return null;
      const originalIndex = position.order[targetIndex] ?? targetIndex;
      const originalDelta = baselineDeltas?.[originalIndex] ?? {};
      const candidateDelta = candidateDeltas[targetIndex] ?? {};
      const keys = new Set([...Object.keys(originalDelta), ...Object.keys(candidateDelta)]);
      if (!keys.size) return pet;
      const source = pet as unknown as Record<string, unknown>;
      const remapped: Record<string, unknown> = {...source};
      for (const key of keys) {
        remapped[key] = (finiteNumber(source[key]) ?? 0) + (candidateDelta[key] ?? 0) - (originalDelta[key] ?? 0);
      }
      return remapped as unknown as PetConfig;
    });
    cache.set(position.id, projected);
    return projected;
  };
}
