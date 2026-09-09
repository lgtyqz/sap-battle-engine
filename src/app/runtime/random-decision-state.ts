import { createSeededRandom } from '../gameplay/simulation-randomness';
import type { RandomDraw } from '../../events';
import {
  RandomDecisionCapture,
  RandomDecisionOption,
  RandomDecisionOverride,
} from 'app/domain/interfaces/simulation-config.interface';

interface RandomDecisionSession {
  capture: boolean;
  strictValidation: boolean;
  overridesByIndex: Map<number, string>;
  overridesByFingerprint: Map<string, string>;
  decisions: RandomDecisionCapture[];
  invalidOverrideError: string | null;
}

export interface RandomChoiceRequest {
  key: string;
  label: string;
  options: RandomDecisionOption[];
}

export interface RandomChoiceResult {
  index: number;
  randomEvent: boolean;
  forced: boolean;
}

function getDecisionFingerprint(key: string, label: string): string {
  return `${key}::${label}`;
}

function sanitizeOptionId(value: string | null | undefined, index: number): string {
  const normalized = (value ?? '').trim();
  return normalized.length > 0 ? normalized : `option-${index + 1}`;
}

export class RandomSource {

  private activeSession: RandomDecisionSession | null = null;
  private source: () => number = Math.random;
  private entropy: () => number;
  private captureDraws = false;
  private tape: readonly RandomDraw[] | undefined;
  private cursor = 0;
  private replayError: Error | null = null;
  draws: RandomDraw[] = [];
  constructor(entropy: () => number = Math.random) { this.entropy = entropy; }
  begin(seed?: number | null, capture = false, tape?: readonly RandomDraw[]) {
    this.source = seed == null || !Number.isFinite(seed) ? this.entropy : createSeededRandom(Math.trunc(seed));
    this.captureDraws = capture; this.tape = tape; this.cursor = 0; this.draws = []; this.replayError = null;
  }
  private draw(stream: 'seeded' | 'shuffle'): number {
    const entry = this.tape?.[this.cursor];
    if (this.tape && (!entry || entry.stream !== stream)) this.failReplay(`Random tape mismatch at draw ${this.cursor}`);
    const value = entry ? entry.value : (stream === 'shuffle' ? this.entropy() : this.source());
    if (!Number.isFinite(value) || value < 0 || value >= 1) this.failReplay('Random values must be finite in [0, 1)');
    this.cursor++;
    if (this.captureDraws) this.draws.push({ stream, value });
    return value;
  }
  private failReplay(message: string): never {
    this.replayError = new Error(message); throw this.replayError;
  }
  assertReplayValid(): void { if (this.replayError) throw this.replayError; }
  getRandomFloat() { return this.draw('seeded'); }
  getRandomInt(min: number, max: number) { return Math.floor(this.getRandomFloat() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min); }
  chance(probability: number) { return this.getRandomFloat() < probability; }
  shuffle<T>(items: T[]): T[] {
    let remaining = items.length;
    while (remaining !== 0) {
      const index = Math.floor(this.getRandomFloat() * remaining); remaining--;
      [items[remaining], items[index]] = [items[index], items[remaining]];
    }
    return items;
  }
  /** Lodash's forward shuffle and separate, seed-independent entropy stream. */
  shuffleCopy<T>(input: readonly T[]): T[] {
    const items = input.slice();
    for (let index = 0; index < items.length; index++) {
      const next = index + Math.floor(this.draw('shuffle') * (items.length - index));
      [items[index], items[next]] = [items[next], items[index]];
    }
    return items;
  }
  get tracksDecisions() { const s = this.activeSession; return !!s && (s.capture || s.overridesByIndex.size > 0 || s.overridesByFingerprint.size > 0); }
  startRandomDecisionSession(options?: {
    capture?: boolean;
    strictValidation?: boolean;
    overrides?: RandomDecisionOverride[] | null;
  }): void {
    const overridesByIndex = new Map<number, string>();
    const overridesByFingerprint = new Map<string, string>();
    for (const override of options?.overrides ?? []) {
      if (!override || !Number.isFinite(override.index)) {
        continue;
      }
      const normalizedIndex = Math.trunc(override.index);
      if (normalizedIndex < 0) {
        continue;
      }
      const optionId = `${override.optionId ?? ''}`.trim();
      if (!optionId) {
        continue;
      }
      const key = `${override.key ?? ''}`.trim();
      const label = `${override.label ?? ''}`.trim();
      if (key && label) {
        overridesByFingerprint.set(getDecisionFingerprint(key, label), optionId);
      }
      overridesByIndex.set(normalizedIndex, optionId);
    }
    this.activeSession = {
      capture: Boolean(options?.capture),
      strictValidation: options?.strictValidation !== false,
      overridesByIndex,
      overridesByFingerprint,
      decisions: [],
      invalidOverrideError: null,
    };
  }

  finishRandomDecisionSession(): {
    decisions: RandomDecisionCapture[];
    invalidOverrideError: string | null;
  } {
    const result = {
      decisions: this.activeSession?.decisions ?? [],
      invalidOverrideError: this.activeSession?.invalidOverrideError ?? null,
    };
    this.activeSession = null;
    return result;
  }

  chooseRandomOption(
    requestOrFactory: RandomChoiceRequest | (() => RandomChoiceRequest),
    randomIndexFactory: () => number,
    optionCount?: number,
  ): RandomChoiceResult {
    if (optionCount != null && !this.tracksDecisions) {
      if (optionCount === 0) return { index: -1, randomEvent: false, forced: false };
      if (optionCount === 1) return { index: 0, randomEvent: false, forced: false };
      const index = Math.max(0, Math.min(optionCount - 1, randomIndexFactory()));
      return { index, randomEvent: true, forced: false };
    }
    const request = typeof requestOrFactory === 'function' ? requestOrFactory() : requestOrFactory;
    const options = request.options.map((option, index) => ({
      id: sanitizeOptionId(option?.id, index),
      label: option?.label ?? option?.id ?? `Option ${index + 1}`,
    }));
    if (options.length === 0) {
      return { index: -1, randomEvent: false, forced: false };
    }
    if (options.length === 1) {
      return { index: 0, randomEvent: false, forced: false };
    }

    const session = this.activeSession;
    const isActuallyRandom = true;
    const shouldTrack =
      Boolean(session) &&
      isActuallyRandom &&
      (session.capture ||
        session.overridesByIndex.size > 0 ||
        session.overridesByFingerprint.size > 0);
    const decisionIndex = session?.decisions.length ?? -1;
    const decisionFingerprint = getDecisionFingerprint(request.key, request.label);
    const forcedOptionId =
      session && decisionIndex >= 0
        ? session.overridesByFingerprint.get(decisionFingerprint) ??
        session.overridesByIndex.get(decisionIndex) ??
        null
        : null;

    let selectedIndex = randomIndexFactory();
    let forced = false;

    if (forcedOptionId) {
      const forcedIndex = options.findIndex((option) => option.id === forcedOptionId);
      if (forcedIndex >= 0) {
        selectedIndex = forcedIndex;
        forced = true;
      } else if (session) {
        if (session.strictValidation) {
          const error = `Random override invalid at step ${decisionIndex + 1}: "${forcedOptionId}" not found for ${request.label}.`;
          session.invalidOverrideError = error;
          throw new Error(error);
        }
      }
    }

    if (selectedIndex < 0 || selectedIndex >= options.length) {
      selectedIndex = Math.max(0, Math.min(options.length - 1, selectedIndex));
    }

    if (shouldTrack && session) {
      session.decisions.push({
        index: decisionIndex,
        key: request.key,
        label: request.label,
        options,
        selectedOptionId: options[selectedIndex]?.id ?? null,
        forced,
      });
    }

    return {
      index: selectedIndex,
      randomEvent: isActuallyRandom,
      forced,
    };
  }

  chooseLegacyRandomOption(
    requestOrFactory: RandomChoiceRequest | (() => RandomChoiceRequest),
    randomIndexFactory: () => number,
    optionCount?: number,
  ): RandomChoiceResult {
    if (optionCount === 1) { randomIndexFactory(); return { index: 0, randomEvent: false, forced: false }; }
    if (optionCount != null) return this.chooseRandomOption(requestOrFactory, randomIndexFactory, optionCount);
    const request = typeof requestOrFactory === 'function' ? requestOrFactory() : requestOrFactory;
    if (optionCount === 1 || request.options.length === 1) {
      randomIndexFactory();
      return { index: 0, randomEvent: false, forced: false };
    }

    return this.chooseRandomOption(request, randomIndexFactory);
  }

}
