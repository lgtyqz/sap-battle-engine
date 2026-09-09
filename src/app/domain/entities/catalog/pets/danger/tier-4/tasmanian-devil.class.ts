import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Spooked } from 'app/domain/entities/catalog/equipment/ailments/spooked.class';

export class TasmanianDevil extends Pet {
  name = 'Tasmanian Devil';
  tier = 4;
  pack: Pack = 'Danger';
  attack = 2;
  health = 6;

  initAbilities(): void {
    this.addAbility(new TasmanianDevilAbility(this.runtime, this, this.logService));
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

export class TasmanianDevilAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'TasmanianDevilAbility',
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

    let targetResp = owner.parent.opponent.getLowestAttackPet(undefined, owner);

    if (targetResp.pet && targetResp.pet.alive) {
      let spookedAilment = new Spooked(this.runtime);
      spookedAilment.multiplier += this.level * 5 - 1;
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${targetResp.pet.name} ${spookedAilment.multiplier}x Spooked.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        randomEvent: targetResp.random,
      });
      targetResp.pet.givePetEquipment(spookedAilment);
      owner.jumpAttackPrep(targetResp.pet);
      owner.jumpAttack(targetResp.pet, tiger, null, targetResp.random);
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): TasmanianDevilAbility {
    return new TasmanianDevilAbility(this.runtime, newOwner, this.logService);
  }
}

