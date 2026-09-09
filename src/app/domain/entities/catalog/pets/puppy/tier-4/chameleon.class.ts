import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { ToyService } from 'app/integrations/toy/toy.service';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { TennisBallAbility } from 'app/domain/entities/catalog/toys/tier-1/tennis-ball.class';
import { BalloonAbility } from 'app/domain/entities/catalog/toys/tier-1/balloon.class';
import { PlasticSawAbility } from 'app/domain/entities/catalog/toys/tier-2/plastic-saw.class';
import { RadioAbility } from 'app/domain/entities/catalog/toys/tier-2/radio.class';
import { OvenMittsAbility } from 'app/domain/entities/catalog/toys/tier-3/oven-mitts.class';
import { ToiletPaperAbility } from 'app/domain/entities/catalog/toys/tier-3/toilet-paper.class';
import { FoamSwordAbility } from 'app/domain/entities/catalog/toys/tier-4/foam-sword.class';
import { ToyGunAbility } from 'app/domain/entities/catalog/toys/tier-4/toy-gun.class';
import { MelonHelmetAbility } from 'app/domain/entities/catalog/toys/tier-4/melon-helmet.class';
import { StinkySockAbility } from 'app/domain/entities/catalog/toys/tier-5/stinky-sock.class';
import { FlashlightAbility } from 'app/domain/entities/catalog/toys/tier-5/flashlight.class';
import { PeanutJarAbility } from 'app/domain/entities/catalog/toys/tier-6/peanut-jar.class';
import { AirPalmTreeAbility } from 'app/domain/entities/catalog/toys/tier-6/air-palm-tree.class';
import { TelevisionAbility } from 'app/domain/entities/catalog/toys/tier-6/television.class';
import { CrystalBallAbility } from 'app/domain/entities/catalog/toys/tier-1/crystal-ball.class';
import { EvilBookAbility } from 'app/domain/entities/catalog/toys/tier-5/evil-book.class';
import { TreasureChestAbility } from 'app/domain/entities/catalog/toys/tier-3/treasure-chest.class';
import { WitchBroomAbility } from 'app/domain/entities/catalog/toys/tier-1/witch-broom.class';
import { TreasureMapAbility } from 'app/domain/entities/catalog/toys/tier-3/treasure-map.class';
import { PandorasBoxAbility } from 'app/domain/entities/catalog/toys/tier-5/pandoras-box.class';
import { StickAbility } from 'app/domain/entities/catalog/toys/tier-1/stick.class';
import { CashRegisterAbility } from 'app/domain/entities/catalog/toys/tier-4/cash-register.class';
import { MicrowaveOvenAbility } from 'app/domain/entities/catalog/toys/tier-2/microwave-oven.class';
import { CameraAbility } from 'app/domain/entities/catalog/toys/tier-5/camera.class';

export class Chameleon extends Pet {
  name = 'Chameleon';
  tier = 4;
  pack: Pack = 'Puppy';
  attack = 3;
  health = 5;

  private toyService: ToyService;
  private equipmentService: EquipmentService;

  initAbilities(): void {
    this.addAbility(
      new ChameleonAbility(this.runtime,
        this,
        this.logService,
        this.abilityService,
        this.equipmentService,
      ),
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
    toyService?: ToyService,
    equipmentService?: EquipmentService,
  ) {
    super(runtime, logService, abilityService, parent);
    this.toyService = toyService;
    this.equipmentService = equipmentService;
    this.initPet(exp, health, attack, mana, equipment, triggersConsumed);
  }
}

// Import all toy ability classes
export class ChameleonAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;
  private equipmentService: EquipmentService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
    equipmentService: EquipmentService,
  ) {
    super(runtime, {
      name: 'ChameleonAbility',
      owner: owner,
      triggers: ['SpecialEndTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      condition: (context: AbilityContext) => {
        const { triggerPet, tiger, pteranodon } = context;
        const owner = this.owner;
        return owner.parent.toy != null;
      },
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.abilityService = abilityService;
    this.equipmentService = equipmentService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;
    owner.removeAbility(this.name, 'Pet');
    this.addToyAbility(owner.parent.toy.name);
  }
  private addToyAbility(toyName: string): void {
    let owner = this.owner;
    const toyAbilityMap: Record<string, () => Ability> = {
      'Tennis Ball': () => new TennisBallAbility(this.runtime, owner, this.logService),
      Balloon: () => new BalloonAbility(this.runtime, owner, this.logService),
      'Plastic Saw': () => new PlasticSawAbility(this.runtime, owner, this.logService),
      Radio: () => new RadioAbility(this.runtime, owner, this.logService),
      'Oven Mitts': () => new OvenMittsAbility(this.runtime, owner, this.logService),
      'Toilet Paper': () => new ToiletPaperAbility(this.runtime, owner, this.logService),
      'Foam Sword': () => new FoamSwordAbility(this.runtime, owner, this.logService),
      'Toy Gun': () => new ToyGunAbility(this.runtime, owner, this.logService),
      'Melon Helmet': () => new MelonHelmetAbility(this.runtime, owner, this.logService),
      'Stinky Sock': () => new StinkySockAbility(this.runtime, owner, this.logService),
      Flashlight: () => new FlashlightAbility(this.runtime, owner, this.logService),
      'Peanut Jar': () => new PeanutJarAbility(this.runtime, owner, this.logService),
      'Air Palm Tree': () => new AirPalmTreeAbility(this.runtime, owner, this.logService),
      Television: () => new TelevisionAbility(this.runtime, owner, this.logService),
      'Crystal Ball': () => new CrystalBallAbility(this.runtime, owner, this.logService),
      //'Candelabra': () => new CandelabraAbility(owner, this.logService, this.abilityService),
      //'Excalibur': () => new ExcaliburAbility(owner, this.logService, this.abilityService),
      'Evil Book': () =>
        new EvilBookAbility(this.runtime, owner, this.logService, this.abilityService),
      //'Glass Shoes': () => new GlassShoesAbility(owner, this.logService, this.abilityService),
      //'Holy Grail': () => new HolyGrailAbility(owner, this.logService, this.abilityService),
      //'Golden Harp': () => new GoldenHarpAbility(owner, this.logService, this.abilityService),
      //'Lock of Hair': () => new LockOfHairAbility(owner, this.logService, this.abilityService),
      //'Magic Lamp': () => new MagicLampAbility(owner, this.logService, this.abilityService),
      //'Magic Carpet': () => new MagicCarpetAbility(owner, this.logService, this.abilityService),
      //'Magic Wand': () => new MagicWandAbility(owner, this.logService, this.abilityService),
      //'Magic Mirror': () => new MagicMirrorAbility(owner, this.logService, this.abilityService),
      //'Nutcracker': () => new NutcrackerAbility(owner, this.logService, this.abilityService),
      //'Pickaxe': () => new PickaxeAbility(owner, this.logService, this.abilityService),
      //'Rosebud': () => new RosebudAbility(owner, this.logService, this.abilityService),
      //'Red Cape': () => new RedCapeAbility(owner, this.logService, this.abilityService),
      'Treasure Chest': () => new TreasureChestAbility(this.runtime, owner, this.logService),
      // 'Tinder Box': () => new TinderBoxAbility(owner, this.logService, this.abilityService),
      'Witch Broom': () => new WitchBroomAbility(this.runtime, owner, this.logService),
      'Treasure Map': () => new TreasureMapAbility(this.runtime, owner, this.logService),
      'Pandoras Box': () =>
        new PandorasBoxAbility(this.runtime,
          owner,
          this.logService,
          this.abilityService,
          this.equipmentService,
        ),
      Stick: () => new StickAbility(this.runtime, owner, this.logService),
      'Cash Register': () => new CashRegisterAbility(this.runtime, owner, this.logService),
      'Microwave Oven': () =>
        new MicrowaveOvenAbility(this.runtime, owner, this.logService, this.equipmentService),
      Camera: () => new CameraAbility(this.runtime, owner, this.logService),
    };

    const abilityFactory = toyAbilityMap[toyName];
    if (abilityFactory) {
      try {
        const toyAbility = abilityFactory();
        toyAbility.abilityLevel = Math.min(owner.parent.toy.level, this.level);
        toyAbility.alwaysIgnorePetLevel = true;
        owner.addAbility(toyAbility);
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${this.name} gained ${toyName} ability!`,
          type: 'ability',
          player: owner.parent,
        });
      } catch (error) {
        console.warn(
          `Failed to add ${toyName} ability to ${this.name}:`,
          error,
        );
      }
    } else {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `Custom toy ability is currently not supported for Chameleon ability`,
        type: 'ability',
        player: owner.parent,
      });
    }
  }

  copy(newOwner: Pet): ChameleonAbility {
    return new ChameleonAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
      this.equipmentService,
    );
  }
}

