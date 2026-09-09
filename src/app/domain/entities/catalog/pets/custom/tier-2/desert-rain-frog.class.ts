import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { PetService } from 'app/integrations/pet/pet.service';

export class DesertRainFrog extends Pet {
  name = 'Desert Rain Frog';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 2;
  health = 4;
  initAbilities(): void {
    this.addAbility(new DesertRainFrogAbility(this.runtime, this, this.logService));
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

export class DesertRainFrogAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'DesertRainFrogAbility',
      owner: owner,
      triggers: ['BeforeThisAttacks'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      condition: (context: AbilityContext): boolean => {
        const owner = this.owner;
        return owner.parent.trumpets >= 1;
      },
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;
    const tigerSupportPet =
      context.tigerSupportPet ?? owner.petBehind(true, true);

    const petService = this.runtime.services.petService;
    let targetTier = Math.min(6, owner.tier + this.level);
    let transformedPet = petService.getRandomFaintPet(owner.parent, {
      tier: targetTier,
      sourcePet: owner,
    });

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} transformed into ${transformedPet.name}.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
      randomEvent: true,
    });

    owner.parent.spendTrumpets(1, owner, pteranodon);
    owner.parent.transformPet(owner, transformedPet);

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution({ ...context, tigerSupportPet });
  }

  copy(newOwner: Pet): DesertRainFrogAbility {
    return new DesertRainFrogAbility(this.runtime, newOwner, this.logService);
  }
}

