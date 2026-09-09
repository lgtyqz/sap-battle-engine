import type { EngineContext } from 'app/runtime/engine-context';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class WhiteTruffle extends Equipment {
  name = 'White Truffle';
  equipmentClass = 'faint' as EquipmentClass;

  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    // Add White Truffle ability using dedicated ability class
    pet.addAbility(new WhiteTruffleAbility(this.runtime, pet, equipment, this.logService));
  };

  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class WhiteTruffleAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;
  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment, logService: LogService) {
    super(runtime, {
      name: 'WhiteTruffleAbility',
      owner: owner,
      triggers: ['PostRemovalFriendFaints'],
      abilityType: 'Equipment',
      native: true,
      maxUses: 1, // Equipment is removed after one use
      abilitylevel: 1,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.equipment = equipment;
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger } = context;
    const owner = this.owner;
    const attackGain = 4 * this.equipment.multiplier;

    owner.increaseAttack(attackGain);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gained ${attackGain} attack (White Truffle)${this.equipment.multiplierMessage}`,
      type: 'equipment',
      player: owner.parent,
    });

    for (let i = 0; i < this.equipment.multiplier; i++) {
      let targetResp = owner.parent.opponent.getHighestAttackPet(
        undefined,
        owner,
      );
      if (targetResp.pet) {
        owner.jumpAttackPrep(targetResp.pet);
        owner.jumpAttack(targetResp.pet, tiger, null, targetResp.random);
      }
    }
    owner.removePerk();
  }
}

