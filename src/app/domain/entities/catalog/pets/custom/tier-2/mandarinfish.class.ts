import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Mandarinfish extends Pet {
  name = 'Mandarinfish';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 2;
  health = 3;
  override initAbilities(): void {
    this.addAbility(new MandarinfishAbility(this.runtime, this, this.logService));
    super.initAbilities();
  }
  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
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

export class MandarinfishAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet, private logService: LogService) {
    super(runtime, {
      name: 'Mandarinfish Ability',
      owner,
      triggers: ['BeforeThisAttacks'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      precondition: () =>
        !!owner.equipment?.equipmentClass?.startsWith('ailment'),
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const ailmentName = owner.equipment?.name;
    if (!ailmentName) {
      return;
    }

    const statGain = this.level * 2;
    owner.removePerk();
    owner.increaseAttack(statGain);
    owner.increaseHealth(statGain);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} replaced ${ailmentName} with +${statGain} attack and +${statGain} health.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): MandarinfishAbility {
    return new MandarinfishAbility(this.runtime, newOwner, this.logService);
  }
}
