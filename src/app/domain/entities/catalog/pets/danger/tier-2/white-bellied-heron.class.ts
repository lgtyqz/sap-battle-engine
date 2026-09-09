import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { MeatBone } from 'app/domain/entities/catalog/equipment/turtle/meat-bone.class';

export class WhiteBelliedHeron extends Pet {
  name = 'White-Bellied Heron';
  tier = 2;
  pack: Pack = 'Danger';
  attack = 4;
  health = 2;
  initAbilities(): void {
    this.addAbility(new WhiteBelliedHeronAbility(this.runtime, this, this.logService));
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

export class WhiteBelliedHeronAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'WhiteBelliedHeronAbility',
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
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let targetResp = owner.parent.nearestPetsAhead(1, owner);
    if (targetResp.pets.length == 0) {
      return;
    }
    let pet = targetResp.pets[0];

    let equipment = new MeatBone(this.runtime);
    equipment.multiplier += this.level - 1;
    pet.givePetEquipment(equipment);
    let effectMessage = '.';
    if (this.level === 2) {
      effectMessage = ' twice for double effect.';
    } else if (this.level === 3) {
      effectMessage = ' thrice for triple effect.';
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} made ${pet.name} Meat Bone${effectMessage}`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      randomEvent: targetResp.random,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): WhiteBelliedHeronAbility {
    return new WhiteBelliedHeronAbility(this.runtime, newOwner, this.logService);
  }
}

