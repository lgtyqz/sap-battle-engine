import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { PetService } from 'app/integrations/pet/pet.service';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

const GOLDEN_TAMARIN_TRANSFORM_POOL = [
  'Skunk',
  'Doberman',
  'Hawk',
  'Humphead Wrasse',
  'Tasmanian Devil',
  'Lynx',
  'Crocodile',
  'Swordfish',
  'Red Dragon',
  'Werewolf',
  'Snow Leopard',
  'Tarantula Hawk',
];

export class GoldenTamarin extends Pet {
  name = 'Golden Tamarin';
  tier = 4;
  pack: Pack = 'Danger';
  attack = 4;
  health = 4;

  initAbilities(): void {
    this.addAbility(
      new GoldenTamarinAbility(this.runtime, this, this.logService, this.petService),
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

export class GoldenTamarinAbility extends Ability {
  private logService: LogService;
  private petService: PetService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService, petService: PetService) {
    super(runtime, {
      name: 'GoldenTamarinAbility',
      owner: owner,
      triggers: ['BeforeStartBattle'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.petService = petService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let targetResp = owner.parent.getThis(owner);
    let target = targetResp.pet;

    if (!target) {
      return;
    }

    const petNames = GOLDEN_TAMARIN_TRANSFORM_POOL;
    const choice = this.runtime.random.chooseRandomOption(
      () => ({
        key: 'pet.golden-tamarin-transform',
        label: formatPetScopedRandomLabel(owner, 'Golden Tamarin transform'),
        options: petNames.map((name) => ({ id: name, label: name })),
      }),
      () => this.runtime.random.getRandomInt(0, petNames.length - 1), (petNames).length
    );
    let selectedPetName = petNames[choice.index];

    let newPet = this.petService.createPet(
      {
        name: selectedPetName,
        health: target.health,
        attack: target.attack,
        mana: target.mana,
        exp: target.exp,
        equipment: target.equipment,
      },
      owner.parent,
    );

    owner.parent.transformPet(target, newPet);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} transformed ${target.name} into a ${newPet.attack}/${newPet.health} ${newPet.name}.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      randomEvent: choice.randomEvent,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): GoldenTamarinAbility {
    return new GoldenTamarinAbility(this.runtime, newOwner, this.logService, this.petService);
  }
}

