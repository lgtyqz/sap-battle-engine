import type { EngineContext } from 'app/runtime/engine-context';
import { GameAPI } from 'app/domain/interfaces/gameAPI.interface';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';
import { LogService } from 'app/integrations/log.service';
import { ToyService } from 'app/integrations/toy/toy.service';
import { Player } from '../../../player.class';
import { Toy } from '../../../toy.class';
import { isRollablePerk } from 'app/integrations/equipment/unrollable-perks';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pet } from '../../../pet.class';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { getOpponent } from 'app/runtime/player-opponent';
import { cloneEquipment } from 'app/runtime/equipment-clone';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

// Equipment effects are now multiplied by toy level via Equipment.getMultiplier()

export class PandorasBox extends Toy {
  name = 'Pandoras Box';
  tier = 5;
  startOfBattle(gameApi?: GameAPI, puma?: boolean) {
    PandorasBoxAbility.applyPandorasBoxEffect({
      logService: this.logService,
      equipmentService: this.equipmentService,
      level: this.level,
      pets: [...gameApi.player.petArray, ...gameApi.opponent.petArray],
      useClones: false,
      logPlayer: this.parent,
      logMeta: { randomEvent: true },
      logMessage: (pet, equipment) =>
        `${this.name} gave ${pet.name} ${equipment.name}`,
    });
  }

  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected toyService: ToyService,
    parent: Player,
    level: number,
    private equipmentService: EquipmentService,
  ) {
    super(runtime, logService, toyService, parent, level);
  }
}

export class PandorasBoxAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;
  private equipmentService: EquipmentService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
    equipmentService: EquipmentService,
  ) {
    super(runtime, {
      name: 'PandorasBoxAbility',
      owner: owner,
      triggers: ['StartBattle'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.abilityService = abilityService;
    this.equipmentService = equipmentService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, tiger, pteranodon } = context;
    const owner = this.owner;
    const opponent = getOpponent(gameApi, owner.parent);
    const pets = [...owner.parent.petArray, ...opponent.petArray].filter(
      (pet) => pet?.alive,
    );
    PandorasBoxAbility.applyPandorasBoxEffect({
      logService: this.logService,
      equipmentService: this.equipmentService,
      level: this.level,
      pets,
      useClones: true,
      logPlayer: owner.parent,
      logMeta: { tiger, pteranodon, randomEvent: true },
      logMessage: (pet, equipment) =>
        `Pandoras Box Ability gave ${pet.name} ${equipment.name}`,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): PandorasBoxAbility {
    return new PandorasBoxAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
      this.equipmentService,
    );
  }

  static applyPandorasBoxEffect(params: {
    logService: LogService;
    equipmentService: EquipmentService;
    level: number;
    pets: Pet[];
    useClones: boolean;
    logPlayer: Player;
    logMeta?: { tiger?: boolean; pteranodon?: boolean; randomEvent?: boolean };
    logMessage: (pet: Pet, equipment: Equipment) => string;
  }): void {
    const {
      logService,
      equipmentService,
      level,
      pets,
      useClones,
      logPlayer,
      logMeta,
      logMessage,
    } = params;

    const ailments = Array.from(
      equipmentService.getInstanceOfAllAilments().values(),
    );
    const excludedPerks = new Set<string>(['Chocolate Cake']);
    const equipments = Array.from(
      equipmentService.getInstanceOfAllEquipment().values(),
    ).filter((equipment) => {
      if (!equipment) {
        return false;
      }
      if (excludedPerks.has(equipment.name)) {
        return false;
      }
      if (!isRollablePerk(equipment)) {
        return false;
      }
      const triggers = equipment.triggers ?? [];
      if (
        triggers.includes('StartTurn') ||
        triggers.includes('EndTurn') ||
        triggers.includes('BeforeStartBattle')
      ) {
        return false;
      }
      return true;
    });

    for (const pet of pets) {
      const poolChoice = params.logService.runtime.random.chooseRandomOption(
        () => ({
          key: 'toy.pandoras-box.pool',
          label: formatPetScopedRandomLabel(pet, 'Pandoras Box pool'),
          options: [
            { id: 'ailments', label: 'Ailments' },
            { id: 'equipment', label: 'Equipment' },
          ],
        }),
        () => params.logService.runtime.random.getRandomInt(0, 1), 2
      );
      const pool = poolChoice.index === 0 ? ailments : equipments;
      if (!pool.length) {
        continue;
      }
      const equipmentChoice = params.logService.runtime.random.chooseRandomOption(
        () => ({
          key: 'toy.pandoras-box.item',
          label: formatPetScopedRandomLabel(pet, 'Pandoras Box item'),
          options: pool.map((equipment) => ({
            id: equipment.name,
            label: equipment.name,
          })),
        }),
        () => params.logService.runtime.random.getRandomInt(0, pool.length - 1), (pool).length
      );
      const baseEquipment = pool[equipmentChoice.index];
      if (!baseEquipment) {
        continue;
      }
      const equipment = useClones
        ? cloneEquipment(baseEquipment)
        : baseEquipment;
      if (!equipment) {
        continue;
      }
      pet.givePetEquipment(equipment, level);
      if (logService.isEnabled()) logService.createLog({
        message: logMessage(pet, equipment),
        type: 'ability',
        player: logPlayer,
        sourcePet: pet,
        tiger: logMeta?.tiger,
        pteranodon: logMeta?.pteranodon,
        randomEvent: logMeta?.randomEvent,
      });
    }
  }
}

