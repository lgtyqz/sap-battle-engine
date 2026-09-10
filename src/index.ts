import { SimulationRunner } from './app/gameplay/simulation-runner';
import {
  SimulationConfig,
  SimulationResult,
  SimulationRunHooks,
  PetConfig,
  BattleDeterminismProbeResult,
} from './app/domain/interfaces/simulation-config.interface';
import { LogService } from './app/integrations/log.service';
import { GameService } from './app/runtime/state/game.service';
import { AbilityService } from './app/integrations/ability/ability.service';
import { AbilityQueueService } from './app/integrations/ability/ability-queue.service';
import { AttackEventService } from './app/integrations/ability/attack-event.service';
import { FaintEventService } from './app/integrations/ability/faint-event.service';
import { ToyEventService } from './app/integrations/ability/toy-event.service';
import { PetService } from './app/integrations/pet/pet.service';
import { EquipmentService } from './app/integrations/equipment/equipment.service';
import { ToyService } from './app/integrations/toy/toy.service';
import { PetFactoryService } from './app/integrations/pet/pet-factory.service';
import { EquipmentFactoryService } from './app/integrations/equipment/equipment-factory.service';
import { ToyFactoryService } from './app/integrations/toy/toy-factory.service';
import { EngineContext } from './app/runtime/engine-context';
export interface BattleEngineOptions { /** Optional entropy source, including legacy shuffle draws. */ entropy?: () => number; }
export interface HeadlessSimulationOptions { enableLogs?: boolean; includeBattles?: boolean; }
export interface BattleEngine {
  runSimulation(config: SimulationConfig, hooks?: SimulationRunHooks): SimulationResult;
  runHeadlessSimulation(config: SimulationConfig, options?: HeadlessSimulationOptions, hooks?: SimulationRunHooks): SimulationResult;
  /** Run one probe battle and report whether it contains any potential or encountered randomness. */
  isBattleDeterministic(config: SimulationConfig): boolean;
  /** Run the determinism probe and retain its one-battle result when one was needed. */
  probeBattleDeterminism(config: SimulationConfig): BattleDeterminismProbeResult;
  /** Apply end-turn events and return the selected side as a five-slot lineup. */
  projectLineupAfterEndTurn(
    baseConfig: SimulationConfig,
    side: 'player' | 'opponent',
    lineup: (PetConfig | null)[],
  ): (PetConfig | null)[];
}
function createRunner(runtime: EngineContext): SimulationRunner {
  const logService = new LogService(runtime);
  const gameService = new GameService(runtime);
  const abilityQueueService = new AbilityQueueService(runtime);
  const toyEventService = new ToyEventService(runtime, gameService, logService);
  const attackEventService = new AttackEventService(runtime, abilityQueueService);
  const faintEventService = new FaintEventService(runtime,
    abilityQueueService,
    toyEventService,
  );
  const abilityService = new AbilityService(runtime,
    gameService,
    logService,
    toyEventService,
    abilityQueueService,
    attackEventService,
    faintEventService,
  );

  // Equipment Logic
  const equipmentFactory = new EquipmentFactoryService(runtime,
    logService,
    abilityService,
    gameService,
  );
  const equipmentService = new EquipmentService(runtime,
    logService,
    abilityService,
    gameService,
    equipmentFactory,
  );

  // Pet Logic
  const petFactory = new PetFactoryService(runtime,
    logService,
    abilityService,
    gameService,
    equipmentService,
  );
  const petService = new PetService(runtime,
    logService,
    abilityService,
    gameService,
    petFactory,
  );

  const toyFactory = new ToyFactoryService(runtime, logService, abilityService);
  const toyService = new ToyService(runtime, logService, abilityService, gameService, equipmentService, petService, toyFactory);
  Object.assign(runtime.services, {
    logService, gameService, abilityService, abilityQueueService,
    petService, equipmentService, toyService, petFactoryService: petFactory,
    equipmentFactoryService: equipmentFactory, toyFactoryService: toyFactory
  });
  petService.init();
  return new SimulationRunner(runtime, logService, gameService, abilityService, petService, equipmentService, toyService);
}

export function createBattleEngine(options: BattleEngineOptions = {}): BattleEngine {
  let runner = createRunner(new EngineContext(options.entropy));
  let busy = false;
  const runSimulation = (config: SimulationConfig, hooks?: SimulationRunHooks): SimulationResult => {
    // Reentrant callbacks get an isolated engine; the outer simulation keeps its state.
    if (busy) return createBattleEngine(options).runSimulation(config, hooks);
    busy = true;
    try { return runner.run(structuredClone(config), hooks); }
    catch (error) { runner = createRunner(new EngineContext(options.entropy)); throw error; }
    finally { busy = false; }
  };
  const projectLineupAfterEndTurn: BattleEngine['projectLineupAfterEndTurn'] = (baseConfig, side, lineup) => {
    // Reentrant calls get isolated state just like runSimulation calls.
    if (busy) return createBattleEngine(options).projectLineupAfterEndTurn(baseConfig, side, lineup);
    busy = true;
    try {
      return runner.projectLineupAfterEndTurn(
        structuredClone(baseConfig),
        side,
        structuredClone(lineup),
      );
    }
    catch (error) { runner = createRunner(new EngineContext(options.entropy)); throw error; }
    finally { busy = false; }
  };
  const probeBattleDeterminism: BattleEngine['probeBattleDeterminism'] = (config) => {
    if (busy) return createBattleEngine(options).probeBattleDeterminism(config);
    busy = true;
    try { return runner.probeBattleDeterminism(structuredClone(config)); }
    catch (error) { runner = createRunner(new EngineContext(options.entropy)); throw error; }
    finally { busy = false; }
  };
  const isBattleDeterministic: BattleEngine['isBattleDeterministic'] = (config) =>
    probeBattleDeterminism(config).deterministic;
  return {
    runSimulation, projectLineupAfterEndTurn, isBattleDeterministic, probeBattleDeterminism, runHeadlessSimulation(config, headless = {}, hooks) {
      const result = runSimulation({ ...config, logsEnabled: headless.enableLogs ?? config.logsEnabled ?? false }, hooks);
      if (!headless.includeBattles) delete result.battles;
      return result;
    }
};
}
export function runSimulation(config: SimulationConfig, hooks?: SimulationRunHooks): SimulationResult {
  return createBattleEngine().runSimulation(config, hooks);
}
export function runHeadlessSimulation(config: SimulationConfig, options?: HeadlessSimulationOptions, hooks?: SimulationRunHooks): SimulationResult {
  return createBattleEngine().runHeadlessSimulation(config, options, hooks);
}
/** Run one probe battle and report whether it contains any potential or encountered randomness. */
export function isBattleDeterministic(config: SimulationConfig): boolean {
  return createBattleEngine().isBattleDeterministic(config);
}
export function projectLineupAfterEndTurn(
  baseConfig: SimulationConfig,
  side: 'player' | 'opponent',
  lineup: (PetConfig | null)[],
): (PetConfig | null)[] {
  return createBattleEngine().projectLineupAfterEndTurn(baseConfig, side, lineup);
}
export type { SimulationConfig, SimulationResult, PetConfig, CustomPackConfig, CustomPackItem, RandomDecisionCapture, RandomDecisionOverride, RandomDecisionOption, SimulationProgress, SimulationRunHooks, BattleDeterminismProbeResult } from './app/domain/interfaces/simulation-config.interface';
export type { PetMemoryField, PetMemoryNumberField, PetMemoryState, PetMemoryStringField } from './app/domain/interfaces/pet-memory.interface';
export type { Battle } from './app/domain/interfaces/battle.interface';
export type { BattleEvent, BoardSnapshot, PetSnapshot, RandomDraw, Side } from './events';
export { catalogs, UPSTREAM_REVISION } from './catalogs';
export type { CatalogAbility, Catalogs, FoodCatalogEntry, PerkCatalogEntry, PetCatalogEntry, ToyCatalogEntry } from './catalogs';

export { optimizeFight, generatePositionings, getPetPositioningHint } from './optimizer/index';
export type { FightOptimizerOptions, FightOptimizerResult, Lineup, Positioning, MatchupEstimate, ResponseStep, OptimizerProgress, OptimizerSide, PetPositioningHint } from './optimizer/index';
