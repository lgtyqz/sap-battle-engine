import { SimulationRunner } from './app/gameplay/simulation-runner';
import {
  SimulationConfig,
  SimulationResult,
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
}
import type { SimulationRunHooks } from './app/gameplay/simulation-runner';

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
  return {
    runSimulation, runHeadlessSimulation(config, headless = {}, hooks) {
      const result = runSimulation({ ...config, logsEnabled: headless.enableLogs ?? config.logsEnabled ?? false }, hooks);
      if (!headless.includeBattles) delete result.battles;
      return result;
    }
};
}
export function runSimulation(config: SimulationConfig, hooks?: SimulationRunHooks): SimulationResult {
  return createBattleEngine().runSimulation(config, hooks);
}
export function runHeadlessSimulation(config: SimulationConfig, options?: HeadlessSimulationOptions): SimulationResult {
  return createBattleEngine().runHeadlessSimulation(config, options);
}
export type { SimulationConfig, SimulationResult, PetConfig, CustomPackConfig, RandomDecisionCapture, RandomDecisionOverride, RandomDecisionOption } from './app/domain/interfaces/simulation-config.interface';
export type { SimulationRunHooks } from './app/gameplay/simulation-runner';
export type { Battle } from './app/domain/interfaces/battle.interface';
export type { BattleEvent, BoardSnapshot, PetSnapshot, RandomDraw, Side } from './events';
export { catalogs, UPSTREAM_REVISION } from './catalogs';

export { optimizeFight, generatePositionings, getPetPositioningHint } from './optimizer/index';
export type { FightOptimizerOptions, FightOptimizerResult, Positioning, MatchupEstimate, ResponseStep, OptimizerProgress, OptimizerSide, PetPositioningHint } from './optimizer/index';
