import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { PetService } from 'app/integrations/pet/pet.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Kappa extends Pet {
  name = 'Kappa';
  tier = 5;
  pack: Pack = 'Custom';
  attack = 4;
  health = 5;
  initAbilities(): void {
    this.addAbility(
      new KappaAbility(this.runtime,
        this,
        this.logService,
        this.abilityService,
        this.petService,
      ),
    );
    super.initAbilities();
  }
  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
    protected petService: PetService,
    parent: Player,
    health?: number,
    attack?: number,
    mana?: number,
    exp?: number,
    equipment?: Equipment,
    triggersConsumed?: number,
  ) {
    super(runtime, logService, abilityService, parent);
    this.initPet(exp, health, attack, mana, equipment, triggersConsumed);
  }
}

export class KappaAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;
  private petService: PetService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
    petService: PetService,
  ) {
    super(runtime, {
      name: 'KappaAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.abilityService = abilityService;
    this.petService = petService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;

    const ownerTierThreePets = this.petService.getPetPoolByTier(
      owner.parent,
      3,
    );
    if (!ownerTierThreePets.length) {
      this.triggerTigerExecution(context);
      return;
    }

    for (let i = 0; i < owner.level; i++) {
      const playerChoice = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.kappa-player-spawn',
          label: formatPetScopedRandomLabel(owner, 'Kappa player spawn', i + 1),
          options: ownerTierThreePets.map((name) => ({ id: name, label: name })),
        }),
        () => this.runtime.random.getRandomInt(0, ownerTierThreePets.length - 1), (ownerTierThreePets).length
      );
      let playerSpawn = ownerTierThreePets[playerChoice.index];
      const opponentChoice = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.kappa-opponent-spawn',
          label: formatPetScopedRandomLabel(owner, 'Kappa opponent spawn', i + 1),
          options: ownerTierThreePets.map((name) => ({ id: name, label: name })),
        }),
        () => this.runtime.random.getRandomInt(0, ownerTierThreePets.length - 1), (ownerTierThreePets).length
      );
      let opponentSpawn = ownerTierThreePets[opponentChoice.index];

      let spawn = this.petService.createPet(
        {
          attack: 14,
          equipment: null,
          exp: 0,
          health: 16,
          mana: 0,
          name: playerSpawn,
        },
        owner.parent,
      );

      let summonResult = owner.parent.summonPet(
        spawn,
        owner.savedPosition,
        false,
        owner,
      );
      if (summonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} spawned a ${spawn.name} (14/16).`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          pteranodon: pteranodon,
          randomEvent: playerChoice.randomEvent,
        });
      }

      let opponentSpawnPet = this.petService.createPet(
        {
          attack: 14,
          equipment: null,
          exp: 0,
          health: 16,
          mana: 0,
          name: opponentSpawn,
        },
        owner.parent.opponent,
      );

      let opponentSummonResult = owner.parent.opponent.summonPet(
        opponentSpawnPet,
        owner.savedPosition,
        false,
        owner,
      );
      if (opponentSummonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} spawned a ${opponentSpawnPet.name} (14/16) for the opponent.`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          pteranodon: pteranodon,
          randomEvent: opponentChoice.randomEvent,
        });
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): KappaAbility {
    return new KappaAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
      this.petService,
    );
  }
}

