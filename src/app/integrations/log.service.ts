import petData from '../../assets/data/pets.json';
import type { EngineContext } from '../runtime/engine-context';
import type { Log } from '../domain/interfaces/log.interface';
import type { Pet } from '../domain/entities/pet.class';
import type { Player } from '../domain/entities/player.class';
import type { BattleEvent, BoardSnapshot, PetSnapshot } from '../../events';

/** An engine-local event sink. Display formatting belongs to the consuming UI. */
export class LogService {
  private petNameRegex: RegExp | null = null;
  private logs: BattleEvent[] = [];
  private enabled = true;
  private battle = 0;
  private identities = new WeakMap<Pet, string>();
  private nextId = 0;
  constructor(public readonly runtime: EngineContext) { }
  setEnabled(value: boolean) { this.enabled = Boolean(value); if (!this.enabled) this.logs = []; }
  isEnabled() { return this.enabled; }
  setDeferDecorations(_value: boolean) { }
  isDeferDecorations() { return true; }
  isShowTriggerNamesInLogs() { return false; }
  beginRun() { this.battle = 0; this.logs = []; }
  reset() { this.logs = []; this.battle++; this.identities = new WeakMap(); this.nextId = 0; }
  getLogs() { return this.logs; }
  snapshotPet(pet: Pet | null | undefined, position?: number): PetSnapshot | null {
    if (!pet) return null;
    let id = this.identities.get(pet);
    if (!id) { id = `${this.battle}:${++this.nextId}`; this.identities.set(pet, id); }
    return {
      id, side: pet.parent?.isOpponent ? 'opponent' : 'player',
      position: position ?? this.position(pet), name: pet.name, attack: pet.attack, health: pet.health,
      exp: pet.exp ?? 0, mana: pet.mana ?? 0, equipment: pet.equipment?.name ?? null,
      equipmentUses: pet.equipment?.uses ?? null
    };
  }
  snapshotBoard(): BoardSnapshot {
    const game = this.runtime.services.gameService.gameApi;
    const team = (player: Player) => Array.from({ length: 5 }, (_, i) => this.snapshotPet(player?.getPetAtPosition(i), i + 1));
    return { player: team(game?.player), opponent: team(game?.opponent) };
  }
  private position(pet: Pet): number {
    for (let i = 0; i < 5; i++) if (pet.parent?.getPetAtPosition(i) === pet) return i + 1;
    return Number.isFinite(pet.savedPosition) ? pet.savedPosition + 1 : 0;
  }
  createLog(log: Log) {
    if (!this.enabled) return;
    const board = this.snapshotBoard();
    log = { ...log };
    if (log.message?.startsWith('Phase ')) log.bold = true;
    this.resolveLogMetadata(log);
    const source = log.sourcePet, target = log.targetPet;
    const message = log.rawMessage ?? log.message ?? '';
    this.logs.push({
      sequence: this.logs.length, battle: this.battle, type: log.type,
      message: message.replace(/<[^>]*>/g, ''), board,
      ...(log.player || log.playerIsOpponent != null ? { side: (log.player?.isOpponent ?? log.playerIsOpponent) ? 'opponent' as const : 'player' as const } : {}),
      ...(source ? { source: this.snapshotPet(source, log.sourceIndex)! } : {}),
      ...(target ? { target: this.snapshotPet(target, log.targetIndex)! } : {}),
      ...Object.fromEntries(['sourceIndex', 'targetIndex', 'randomEvent', 'tiger', 'puma', 'pteranodon', 'pantherMultiplier', 'count', 'bold', 'noCollapse'].filter(k => log[k as keyof Log] !== undefined).map(k => [k, log[k as keyof Log]])),
      ...(log.targetIsOpponent != null ? { targetSide: log.targetIsOpponent ? 'opponent' as const : 'player' as const } : {}),
      ...(log.randomEventReason || log.randomEvent ? { randomEventReason: log.randomEventReason ?? 'true-random' } : {}),
    });
  }
  printState(_player: Player, _opponent: Player, message?: string) {
    if (!this.enabled) return;
    if (message) this.createLog({ message, type: 'board' });
    this.createLog({ message: '', type: 'board' });
  }
  private resolveLogMetadata(log: Log): void {
    if (!log.sourcePet && log.player && log.message) {
      const possiblePets = log.player.petArray.filter(
        (p) => p && log.message.startsWith(p.name),
      );
      if (possiblePets.length === 1) {
        log.sourcePet = possiblePets[0] as Pet;
      }
    }
    if (log.type === 'attack' && log.player && log.message) {
      this.resolveAttackPetsFromMessage(log);
    }
    if (!log.randomEventReason && log.randomEvent === true) {
      log.randomEventReason = 'true-random';
    }
    if (log.player && log.message) {
      this.resolveSourceTargetFromMessage(log);
    }
    if (log.sourcePet && log.sourceIndex == null) {
      log.sourceIndex = this.getFrontIndex(log.sourcePet) ?? undefined;
    }
    if (log.targetPet && log.targetIndex == null) {
      log.targetIndex = this.getFrontIndex(log.targetPet) ?? undefined;
    }
  }
  private getFrontIndex(pet: Pet): number | null {
    const parent = pet?.parent;
    if (!parent) {
      return null;
    }
    if (parent.pet0 === pet) {
      return 1;
    }
    if (parent.pet1 === pet) {
      return 2;
    }
    if (parent.pet2 === pet) {
      return 3;
    }
    if (parent.pet3 === pet) {
      return 4;
    }
    if (parent.pet4 === pet) {
      return 5;
    }
    if (Number.isFinite(pet.savedPosition)) {
      return pet.savedPosition + 1;
    }
    return null;
  }
  private resolveAttackPetsFromMessage(log: Log): void {
    if (!log?.message || !log.player) {
      return;
    }
    if (log.sourcePet && log.targetPet) {
      return;
    }
    const message = log.message;
    const snipedMatch = /^(.+?)\s+sniped\s+(.+?)\s+for\s+/i.exec(message);
    const attackMatch =
      /^(.+?)\s+(?:jump-)?attacks?\s+(.+?)\s+for\s+/i.exec(message);
    const match = snipedMatch ?? attackMatch;
    if (!match) {
      return;
    }
    const sourceName = match[1].trim();
    const targetName = match[2].trim();
    const playerPets = log.player.petArray ?? [];
    const opponentPets = log.player.opponent?.petArray ?? [];

    if (!log.sourcePet) {
      log.sourcePet =
        playerPets.find((pet) => pet?.name === sourceName) ?? null;
    }
    if (!log.targetPet) {
      log.targetPet =
        opponentPets.find((pet) => pet?.name === targetName) ??
        playerPets.find((pet) => pet?.name === targetName) ??
        null;
    }
  }
  private resolveSourceTargetFromMessage(log: Log): void {
    if (log.sourcePet && log.targetPet) {
      return;
    }
    const message = log.message;
    if (!message) {
      return;
    }
    const names = this.extractPetNames(message);
    if (names.length < 2) {
      return;
    }

    const playerPets = log.player?.petArray ?? [];
    const opponentPets = log.player?.opponent?.petArray ?? [];

    const findPet = (
      pets: Pet[],
      name: string,
      exclude?: Pet | null,
    ): Pet | null =>
      pets.find((pet) => pet?.name === name && pet !== exclude) ?? null;

    if (!log.sourcePet) {
      log.sourcePet =
        findPet(playerPets, names[0]) ?? findPet(opponentPets, names[0]);
    }

    if (!log.targetPet) {
      if (names[1] === names[0]) {
        const messageStartsWithSource =
          log.sourcePet && message.startsWith(log.sourcePet.name);
        if (messageStartsWithSource && log.sourcePet) {
          // Prefer self-target when the message begins with the source name and the names match.
          log.targetPet = log.sourcePet;
        } else {
          log.targetPet =
            findPet(playerPets, names[1], log.sourcePet) ??
            findPet(opponentPets, names[1], log.sourcePet) ??
            log.sourcePet ??
            null;
        }
      } else {
        log.targetPet =
          findPet(opponentPets, names[1]) ?? findPet(playerPets, names[1]);
      }
    }
  }
  private extractPetNames(message: string): string[] {
    if (!this.petNameRegex) {
      const special = new Set('.*+?^${}()|[]' + String.fromCharCode(92));
      const names = petData.map(p => p.Name).filter(Boolean).sort((a, b) => b.length - a.length).map(name => [...name].map(char => special.has(char) ? String.fromCharCode(92) + char : char).join(''));
      this.petNameRegex = new RegExp('(?<![A-Za-z0-9])(' + names.join('|') + ')(?![A-Za-z0-9])', 'g');
    }
    if (!message) {
      return [];
    }
    const matches = message.match(this.petNameRegex);
    return matches ?? [];
  }
}
