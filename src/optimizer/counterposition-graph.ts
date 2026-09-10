import type { FightOptimizerResult, MatchupEstimate, OptimizerSide, ResponseStep } from './types';

interface CounterpositionEdge {
  source: string;
  target: string;
  step: ResponseStep;
}

export interface CondensedResponseTrace {
  steps: ResponseStep[];
  cycle?: FightOptimizerResult['cycle'];
}

type MatchupLookup = (player: number, opponent: number) => MatchupEstimate | undefined;

function node(side: OptimizerSide, position: number): string {
  return `${side}:${position}`;
}

function edgeForResponse(step: ResponseStep, response: number, matchup: MatchupEstimate): CounterpositionEdge {
  const playerPosition = step.side === 'player' ? response : step.playerPosition;
  const opponentPosition = step.side === 'opponent' ? response : step.opponentPosition;
  const sourceSide: OptimizerSide = step.side === 'player' ? 'opponent' : 'player';
  const sourcePosition = sourceSide === 'player' ? playerPosition : opponentPosition;
  return {
    source: node(sourceSide, sourcePosition),
    target: node(step.side, response),
    step: {...step, playerPosition, opponentPosition, matchup: {...matchup, playerPosition, opponentPosition}},
  };
}

function graphEdges(steps: ResponseStep[], matchup: MatchupLookup): CounterpositionEdge[] {
  const edges: CounterpositionEdge[] = [];
  for (const step of steps) {
    const actualResponse = step.side === 'player' ? step.playerPosition : step.opponentPosition;
    const responses = step.bestResponses.includes(actualResponse)
      ? step.bestResponses
      : [...step.bestResponses, actualResponse];
    for (const response of responses) {
      const player = step.side === 'player' ? response : step.playerPosition;
      const opponent = step.side === 'opponent' ? response : step.opponentPosition;
      const estimate = response === actualResponse ? step.matchup : matchup(player, opponent);
      if (estimate) edges.push(edgeForResponse(step, response, estimate));
    }
  }
  return edges;
}

function shortestPath(edges: CounterpositionEdge[], start: string, end: string): CounterpositionEdge[] | undefined {
  if (start === end) return [];
  const outgoing = new Map<string, CounterpositionEdge[]>();
  for (const edge of edges) {
    const entries = outgoing.get(edge.source);
    if (entries) entries.push(edge);
    else outgoing.set(edge.source, [edge]);
  }
  const queue = [start];
  const visited = new Set(queue);
  const previous = new Map<string, CounterpositionEdge>();
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const edge of outgoing.get(queue[cursor]) ?? []) {
      if (visited.has(edge.target)) continue;
      visited.add(edge.target);
      previous.set(edge.target, edge);
      if (edge.target === end) {
        const path: CounterpositionEdge[] = [];
        let current = end;
        while (current !== start) {
          const prior = previous.get(current);
          if (!prior) return undefined;
          path.push(prior);
          current = prior.source;
        }
        return path.reverse();
      }
      queue.push(edge.target);
    }
  }
  return undefined;
}

function reindex(edges: CounterpositionEdge[]): ResponseStep[] {
  return edges.map((edge, index) => ({
    ...edge.step,
    index,
    matchup: {...edge.step.matchup},
    bestResponses: edge.step.bestResponses.slice(),
  }));
}

/** Return the shortest known counterposition chain ending in the same terminal response. */
export function condenseResponseTrace(
  steps: ResponseStep[],
  termination: FightOptimizerResult['termination'],
  cycle: FightOptimizerResult['cycle'] | undefined,
  matchup: MatchupLookup,
): CondensedResponseTrace {
  const last = steps.at(-1);
  if (!last) return {steps: []};
  const edges = graphEdges(steps, matchup);
  const actualResponse = last.side === 'player' ? last.playerPosition : last.opponentPosition;
  const terminal = edgeForResponse(last, actualResponse, last.matchup);
  const start = node('opponent', 0);
  const fallback = (): CondensedResponseTrace => ({
    steps: reindex(steps.map(step => edgeForResponse(
      step,
      step.side === 'player' ? step.playerPosition : step.opponentPosition,
      step.matchup,
    ))),
    ...(cycle ? {cycle} : {}),
  });
  const prefix = shortestPath(edges, start, terminal.source);
  if (!prefix) return fallback();

  if (termination !== 'cycle') return {steps: reindex([...prefix, terminal])};

  // Repeating the terminal transition on both sides of the shortest return path
  // preserves a concrete cycle while discarding longer routes around the graph.
  const returnPath = shortestPath(edges, terminal.target, terminal.source);
  if (!returnPath) return fallback();
  const selected = [...prefix, terminal, ...returnPath, terminal];
  const startState = prefix.length + 1;
  return {steps: reindex(selected), cycle: {startState, endState: selected.length, length: returnPath.length + 1}};
}
