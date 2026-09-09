import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { PetService } from 'app/integrations/pet/pet.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Orca extends Pet {
  name = 'Orca';
  tier = 6;
  pack: Pack = 'Star';
  attack = 5;
  health = 7;
  initAbilities(): void {
    this.addAbility(
      new OrcaAbility(this.runtime,
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

export class OrcaAbility extends Ability {
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
      name: 'OrcaAbility',
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
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    for (let i = 0; i < this.level; i++) {
      let faintPet = this.petService.getRandomFaintPet(owner.parent, {
        excludeNames: [owner.name, 'Quetzalcoatlus'],
        sourcePet: owner,
        fromAnyPack: true,
      });
      faintPet.attack = 6;
      faintPet.health = 6;

      let summonResult = owner.parent.summonPet(
        faintPet,
        owner.savedPosition,
        false,
        owner,
      );
      if (summonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} spawned a 6/6 ${faintPet.name}.`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          randomEvent: true,
          pteranodon: pteranodon,
        });
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): OrcaAbility {
    return new OrcaAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
      this.petService,
    );
  }
}

