import { describe, expect, it } from 'vitest';
import {
  BATTLE_PHASE_ORDER,
  COUNTER_ABILITY_ORDER,
  NORMAL_ABILITY_ORDER,
  SAME_TRIGGER_ORDER,
  getAbilityPriority,
} from '../src/app/integrations/ability/ability-priorities';

describe('ability ordering catalog', () => {
  it('matches the four battle phases and their internal groups', () => {
    expect(BATTLE_PHASE_ORDER.map((phase) => phase.label)).toEqual([
      'Before battle',
      'Start of battle',
      'Before attack',
      'After attack',
    ]);
    expect(BATTLE_PHASE_ORDER[2].groups.map((group) => group.triggers)).toEqual([
      ['BeforeThisAttacks', 'BeforeFirstAttack'],
      [
        'BeforeFriendAttacks',
        'BeforeFriendlyAttack',
        'BeforeAdjacentFriendAttacked',
      ],
    ]);
    expect(BATTLE_PHASE_ORDER[3].groups.map((group) => group.triggers)).toEqual([
      ['ThisAttacked', 'ThisFirstAttack'],
      [
        'FriendAttacked',
        'FriendAheadAttacked',
        'FriendlyAttacked',
        'AdjacentFriendAttacked',
        'AnyoneAttack',
        'EnemyAttacked',
      ],
    ]);
  });

  it('catalogs every normal-order slot including the removal step', () => {
    expect(NORMAL_ABILITY_ORDER.map((entry) => entry.priority)).toEqual(
      Array.from({ length: 26 }, (_, index) => index + 1),
    );
    expect(NORMAL_ABILITY_ORDER[23]).toMatchObject({
      priority: 24,
      label: 'Fainted pets disappear',
      systemStep: true,
    });
  });

  it('documents same-trigger attack order and its perk exceptions', () => {
    expect(SAME_TRIGGER_ORDER).toEqual([
      { order: 1, label: 'Churros pets' },
      {
        order: 2,
        label: 'Other pets',
        comparison: 'Higher attack first; ties random',
      },
      { order: 3, label: 'Macaron pets' },
    ]);
  });

  it('puts every numbered trigger in the counter slot', () => {
    expect(COUNTER_ABILITY_ORDER).toEqual({
      priority: 18,
      eventType: 'CounterEvent',
      incrementRule: 'Ability-specific source event',
    });
    expect(getAbilityPriority('FriendHurt')).toBe(4);
    expect(getAbilityPriority('FriendHurt4')).toBe(18);
    expect(getAbilityPriority('FriendlyAttacked5')).toBe(18);
    expect(getAbilityPriority('EnemyAttacked5')).toBe(18);
    expect(getAbilityPriority('PostRemovalFriendFaints2')).toBe(18);
    expect(getAbilityPriority('EnemyFaint3')).toBe(18);
  });

  it('keeps post-removal triggers in their documented normal-order slots', () => {
    const friendFaintEntry = NORMAL_ABILITY_ORDER.find(
      (entry) => entry.priority === 12,
    );
    expect(getAbilityPriority('PostRemovalFaint')).toBe(11);
    expect(getAbilityPriority('PostRemovalFriendFaints')).toBe(12);
    expect(getAbilityPriority('EnemyFaint')).toBe(12);
    expect(getAbilityPriority('FriendlyToyBroke')).toBe(12);
    expect(friendFaintEntry?.postRemovalTriggers).toContain(
      'AdjacentFriendsFaint',
    );
    expect(friendFaintEntry?.postRemovalTriggers).toContain(
      'FriendlyToyBroke',
    );
    expect(friendFaintEntry?.postRemovalTriggers).not.toContain('FriendFaints');
    expect(getAbilityPriority('EmptyFrontSpace')).toBe(25);
    expect(getAbilityPriority('GoldenRetrieverSummons')).toBe(26);
  });
});
