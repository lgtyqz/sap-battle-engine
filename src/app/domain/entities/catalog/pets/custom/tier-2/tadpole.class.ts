import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { PetService } from 'app/integrations/pet/pet.service';
import { levelToExp } from 'app/runtime/experience';

export class Tadpole extends Pet {
  name = 'Tadpole';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 2;
  health = 2;

  override initAbilities(): void {
    this.addAbility(new TadpoleAbility(this.runtime, this, this.logService, this.petService));
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

export class TadpoleAbility extends Ability {
  private logService: LogService;
  private petService: PetService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService, petService: PetService) {
    super(runtime, {
      name: 'Tadpole Ability',
      owner: owner,
      triggers: ['StartBattle'],
      abilityType: 'Pet',
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
    this.petService = petService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const level = owner.level;

    // Create a new Frog
    const frog = this.petService.createPet(
      {
        name: 'Frog',
        attack: null,
        health: null,
        mana: 0,
        exp: levelToExp(level),
        equipment: null,
      },
      owner.parent,
    );

    if (frog) {
      // Transformation
      owner.parent.transformPet(owner, frog);

      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} transformed into a level ${level} Frog.`,
        type: 'ability',
        player: owner.parent,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): TadpoleAbility {
    return new TadpoleAbility(this.runtime, newOwner, this.logService, this.petService);
  }
}

