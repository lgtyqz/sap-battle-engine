import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { CuckooChick } from 'app/domain/entities/catalog/pets/custom/token/cuckoo-chick.class';

export class Cuckoo extends Pet {
  name = 'Cuckoo';
  tier = 5;
  pack: Pack = 'Custom';
  attack = 5;
  health = 4;
  override initAbilities(): void {
    this.addAbility(
      new CuckooAbility(this.runtime, this, this.logService, this.abilityService),
    );
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

export class CuckooAbility extends Ability {
  constructor(runtime: EngineContext,
    owner: Pet,
    private logService: LogService,
    private abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'CuckooAbility',
      owner: owner,
      triggers: ['EnemyFaint'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
  }

  private executeAbility(context: AbilityContext): void {
    const { triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;
    const opponent = owner.parent.opponent;

    // Limit 2/4/6 per battle
    const maxUses = this.level * 2;
    if (this.currentUses > maxUses) {
      return;
    }

    let cuckooChick = new CuckooChick(this.runtime,
      this.logService,
      this.abilityService,
      opponent,
    );

    // Initializing stats via initPet
    // Correct order: exp, health, attack, mana, equipment, triggersConsumed
    cuckooChick.initPet(0, 1, 1, 0, null, 0);

    const summonIdx = triggerPet?.savedPosition ?? 0;

    let summonResult = opponent.summonPet(cuckooChick, summonIdx, true, owner);

    if (summonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} summoned Cuckoo Chick for the enemy Early.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: summonResult.randomEvent,
      });
    }

    // Trigger Tiger execution if needed
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): CuckooAbility {
    return new CuckooAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

