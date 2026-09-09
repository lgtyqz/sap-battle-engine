import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { PetService } from 'app/integrations/pet/pet.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

const BAY_CAT_SUMMON_POOL = [
  'Skunk',
  'Doberman',
  'Hawk',
  'Humphead Wrasse',
  'Tasmanian Devil',
  'Lynx',
];

export class BayCat extends Pet {
  name = 'Bay Cat';
  tier = 6;
  pack: Pack = 'Danger';
  attack = 7;
  health = 5;

  initAbilities(): void {
    this.addAbility(
      new BayCatAbility(this.runtime,
        this,
        this.logService,
        this.petService,
        this.abilityService,
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

export class BayCatAbility extends Ability {
  private logService: LogService;
  private petService: PetService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    petService: PetService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'BayCatAbility',
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
    this.petService = petService;
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    const bayPool = BAY_CAT_SUMMON_POOL;

    for (let i = 0; i < owner.level; i++) {
      const choice = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.bay-cat-summon',
          label: formatPetScopedRandomLabel(owner, 'Bay Cat summon', i + 1),
          options: bayPool.map((name) => ({ id: name, label: name })),
        }),
        () => this.runtime.random.getRandomInt(0, bayPool.length - 1), (bayPool).length
      );
      let petName = bayPool[choice.index];
      let summonedPet = this.petService.createPet(
        {
          name: petName,
          attack: null,
          health: null,
          equipment: null,
          mana: 0,
          exp: 0,
        },
        owner.parent,
      );

      let summonResult = owner.parent.summonPet(
        summonedPet,
        owner.savedPosition,
        false,
        owner,
      );
      if (summonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} summoned ${summonedPet.name}`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          pteranodon: pteranodon,
          randomEvent: choice.randomEvent,
        });

        // Activate start of battle ability
        if (summonedPet.hasAbility('StartBattle')) {
          if (this.logService.isEnabled()) this.logService.createLog({
            message: `${summonedPet.name} activated its start of battle ability`,
            type: 'ability',
            player: owner.parent,
            tiger: tiger,
            pteranodon: pteranodon,
          });
          summonedPet.activateAbilities('StartBattle', gameApi, 'Pet');
        }
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): BayCatAbility {
    return new BayCatAbility(this.runtime,
      newOwner,
      this.logService,
      this.petService,
      this.abilityService,
    );
  }
}

