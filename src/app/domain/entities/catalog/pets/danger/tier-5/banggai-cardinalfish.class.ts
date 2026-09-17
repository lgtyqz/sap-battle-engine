import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { GiantOtterAbility } from 'app/domain/entities/catalog/pets/danger/tier-4/giant-otter.class';

export class BanggaiCardinalfish extends Pet {
  name = 'Banggai Cardinalfish';
  tier = 5;
  pack: Pack = 'Danger';
  attack = 6;
  health = 5;

  initAbilities(): void {
    this.addAbility(new BanggaiCardinalfishAbility(this.runtime, this, this.logService));
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

export class BanggaiCardinalfishAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'BanggaiCardinalfishAbility',
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

    const attackReduction = this.level * 6; // 6/12/18 based on level
    const minimumAttack = 4;

    let targetResp = owner.parent.getAll(true, owner, true);
    for (const targetPet of targetResp.pets) {
      const startingAttack = targetPet.attack;
      const newAttack =
        startingAttack > minimumAttack
          ? Math.max(startingAttack - attackReduction, minimumAttack)
          : startingAttack;

      targetPet.attack = newAttack;
      let remainingReduction = Math.max(0, startingAttack - newAttack);
      if (remainingReduction > 0) {
        for (const friend of targetPet.parent.petArray) {
          for (const ability of friend.getAbilities(undefined, 'Pet')) {
            if (ability instanceof GiantOtterAbility) {
              remainingReduction -= ability.consumeTemporaryAttack(
                targetPet,
                remainingReduction,
              );
              if (remainingReduction <= 0) {
                break;
              }
            }
          }
          if (remainingReduction <= 0) {
            break;
          }
        }
      }
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} reduced ${targetPet.name} attack by ${attackReduction} to ${newAttack}.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        randomEvent: targetResp.random,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): BanggaiCardinalfishAbility {
    return new BanggaiCardinalfishAbility(this.runtime, newOwner, this.logService);
  }
}
