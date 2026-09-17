import {
  AbilityTrigger,
  NumberedTriggerBase,
} from 'app/domain/entities/ability.class';

export type TriggerCategory = AbilityTrigger | NumberedTriggerBase;

export type AbilityOrderCatalogEntry = Readonly<{
  priority: number;
  label: string;
  triggers: ReadonlyArray<TriggerCategory | 'CounterEvent'>;
  postRemovalTriggers?: ReadonlyArray<TriggerCategory>;
  systemStep?: boolean;
}>;

/**
 * Ordering within one trigger. Churros and Macaron are explicit perk
 * exceptions; ordinary pets use attack descending with random tie-breaking.
 */
export const SAME_TRIGGER_ORDER = [
  { order: 1, label: 'Churros pets' },
  {
    order: 2,
    label: 'Other pets',
    comparison: 'Higher attack first; ties random',
  },
  { order: 3, label: 'Macaron pets' },
] as const;

/**
 * Source events only increment an ability-specific counter. Reaching its
 * threshold queues this shared event category; the numbered trigger is kept
 * separately as the ability that will execute.
 */
export const COUNTER_ABILITY_ORDER = {
  priority: 18,
  eventType: 'CounterEvent',
  incrementRule: 'Ability-specific source event',
} as const;

/**
 * Canonical normal ability order. Lower numbers resolve first. Entries queued
 * by an ability are inserted back into this order rather than appended.
 */
export const NORMAL_ABILITY_ORDER: ReadonlyArray<AbilityOrderCatalogEntry> = [
  { priority: 1, label: 'Level up', triggers: ['ThisLeveledUp'] },
  {
    priority: 2,
    label: 'Friend or friendly level up',
    triggers: ['FriendLeveledUp', 'FriendlyLeveledUp', 'AnyLeveledUp'],
  },
  { priority: 3, label: 'Hurt', triggers: ['ThisHurt'] },
  {
    priority: 4,
    label: 'Friend or enemy hurt',
    triggers: [
      'FriendHurt',
      'EnemyHurt',
      'AnyoneHurt',
      'FriendAheadHurt',
      'AdjacentFriendsHurt',
      'AnyoneBehindHurt',
    ],
  },
  { priority: 5, label: 'Gains mana', triggers: ['ThisGainedMana'] },
  { priority: 6, label: 'Summoned', triggers: ['ThisSummoned'] },
  {
    priority: 7,
    label: 'Friend or enemy summoned',
    triggers: ['FriendSummoned', 'EnemySummoned', 'BeeSummoned'],
  },
  {
    priority: 8,
    label: 'Friend jumped or enemy pushed',
    triggers: ['FriendJumped', 'EnemyPushed', 'AnyoneJumped'],
  },
  { priority: 9, label: 'Faint', triggers: ['Faint'] },
  {
    priority: 10,
    label: 'Friend ahead faints',
    triggers: ['FriendAheadFainted'],
  },
  {
    priority: 11,
    label: 'After faint',
    triggers: ['PostRemovalFaint'],
    postRemovalTriggers: ['PostRemovalFaint'],
  },
  {
    priority: 12,
    label: 'Friend or enemy faints; friendly toy broke',
    triggers: [
      'FriendFaints',
      'PostRemovalFriendFaints',
      'EnemyFaint',
      'EnemyFainted',
      'PetFainted',
      'AdjacentFriendsFaint',
      'FriendlyToyBroke',
    ],
    // FriendFaints is the pre-removal Kitsune exception. The other faint
    // observer events are emitted only after the fainted pet is removed.
    postRemovalTriggers: [
      'PostRemovalFriendFaints',
      'EnemyFaint',
      'EnemyFainted',
      'PetFainted',
      'AdjacentFriendsFaint',
      'FriendlyToyBroke',
    ],
  },
  { priority: 13, label: 'Knock out', triggers: ['KnockOut'] },
  { priority: 14, label: 'Transformed', triggers: ['ThisTransformed'] },
  {
    priority: 15,
    label: 'Friend transformed',
    triggers: ['FriendTransformed'],
  },
  {
    priority: 16,
    label: 'Friend gained experience',
    triggers: ['FriendGainedExp', 'FriendlyGainedExp'],
  },
  {
    priority: 17,
    label: 'Friendly ate food or eats food',
    triggers: [
      'FoodEatenByAny',
      'FoodEatenByThis',
      'FoodEatenByFriend',
      'FoodEatenByFriendly',
      'AppleEatenByThis',
      'CornEatenByThis',
      'CornEatenByFriend',
      'Eat',
    ],
  },
  {
    priority: COUNTER_ABILITY_ORDER.priority,
    label: 'Counter abilities',
    triggers: [COUNTER_ABILITY_ORDER.eventType],
  },
  {
    priority: 19,
    label: 'Friend lost perk',
    triggers: [
      'ThisLostPerk',
      'FriendLostPerk',
      'PetLostPerk',
      'LostStrawberry',
      'FriendLostStrawberry',
    ],
  },
  {
    priority: 20,
    label: 'Gain perk or ailment',
    triggers: ['ThisGainedPerk', 'ThisGainedAilment', 'ThisGainedStrawberry'],
  },
  {
    priority: 21,
    label: 'Friendly or enemy gained perk or ailment',
    triggers: [
      'FriendGainsPerk',
      'FriendlyGainsPerk',
      'FriendGainsAilment',
      'EnemyGainedAilment',
      'AnyoneGainedAilment',
      'FriendGainedStrawberry',
      'FriendlyGainedStrawberry',
      'AnyoneGainedWeak',
    ],
  },
  {
    priority: 22,
    label: 'Pet flung',
    triggers: ['FriendFlung', 'AnyoneFlung'],
  },
  { priority: 23, label: 'Mana snipe', triggers: ['ManaSnipe'] },
  {
    priority: 24,
    label: 'Fainted pets disappear',
    triggers: [],
    systemStep: true,
  },
  {
    priority: 25,
    label: 'Empty front space',
    triggers: ['EmptyFrontSpace'],
  },
  {
    priority: 26,
    label: 'Golden Retriever summons',
    triggers: ['GoldenRetrieverSummons'],
  },
];

export type BattlePhaseCatalogEntry = Readonly<{
  phase: 1 | 2 | 3 | 4;
  label: string;
  groups: ReadonlyArray<
    Readonly<{
      order: number;
      label: string;
      triggers: ReadonlyArray<TriggerCategory>;
      sourceOrder?: ReadonlyArray<'Churros pets' | 'Toys' | 'Pets'>;
    }>
  >;
}>;

/** Phase-only triggers resolve before the normal-order queue for that phase. */
export const BATTLE_PHASE_ORDER: ReadonlyArray<BattlePhaseCatalogEntry> = [
  {
    phase: 1,
    label: 'Before battle',
    groups: [
      { order: 1, label: 'Before battle', triggers: ['BeforeStartBattle'] },
    ],
  },
  {
    phase: 2,
    label: 'Start of battle',
    groups: [
      {
        order: 1,
        label: 'Start of battle',
        triggers: ['StartBattle'],
        sourceOrder: ['Churros pets', 'Toys', 'Pets'],
      },
    ],
  },
  {
    phase: 3,
    label: 'Before attack',
    groups: [
      {
        order: 1,
        label: 'Before attack',
        triggers: ['BeforeThisAttacks', 'BeforeFirstAttack'],
      },
      {
        order: 2,
        label: 'Before friend attacks',
        triggers: [
          'BeforeFriendAttacks',
          'BeforeFriendlyAttack',
          'BeforeAdjacentFriendAttacked',
        ],
      },
    ],
  },
  {
    phase: 4,
    label: 'After attack',
    groups: [
      {
        order: 1,
        label: 'After attack',
        triggers: ['ThisAttacked', 'ThisFirstAttack'],
      },
      {
        order: 2,
        label: 'Friend, friend ahead, or friendly attacked',
        triggers: [
          'FriendAttacked',
          'FriendAheadAttacked',
          'FriendlyAttacked',
          'AdjacentFriendAttacked',
          'AnyoneAttack',
          'EnemyAttacked',
        ],
      },
    ],
  },
];

const normalPriorities = Object.fromEntries(
  NORMAL_ABILITY_ORDER.flatMap((entry) =>
    entry.triggers.map((trigger) => [trigger, entry.priority]),
  ),
);
const phasePriorities = Object.fromEntries(
  BATTLE_PHASE_ORDER.flatMap((phase) =>
    phase.groups.flatMap((group) =>
      group.triggers.map((trigger) => [trigger, 29 + group.order]),
    ),
  ),
);

// Priority mapping (lower number = higher priority). Phase values are only
// compared inside their explicit phase filters.
export const ABILITY_PRIORITIES: Readonly<Record<string, number>> =
  Object.freeze({ ...normalPriorities, ...phasePriorities });

export const isNumberedCounterTrigger = (
  trigger: string | null | undefined,
): boolean => typeof trigger === 'string' && /\d+$/.test(trigger);

// Phase triggers (handled by explicit phase filters in AbilityService).

export const PHASE_TRIGGERS: ReadonlyArray<TriggerCategory> = [
  ...BATTLE_PHASE_ORDER.flatMap((phase) =>
    phase.groups.flatMap((group) => group.triggers),
  ),
];

// Attack-based trigger sources. Non-numbered entries use their phase filters;
// numbered entries re-enter the normal queue as counter abilities (slot 18).
export const ATTACK_TRIGGERS: ReadonlyArray<TriggerCategory> = [
  'BeforeFriendlyAttack',
  'BeforeThisAttacks',
  'BeforeFirstAttack',
  'BeforeFriendAttacks',
  'BeforeAdjacentFriendAttacked',
  'AnyoneAttack',
  'EnemyAttacked',
  'EnemyAttacked2',
  'EnemyAttacked5',
  'EnemyAttacked7',
  'EnemyAttacked8',
  'FriendlyAttacked',
  'FriendlyAttacked5',
  'FriendAttacked',
  'FriendAheadAttacked',
  'AdjacentFriendAttacked',
  'ThisAttacked',
  'ThisFirstAttack',
];

// In-shop triggers (handled by shop/buy/sell/roll logic).
export const IN_SHOP_TRIGGERS: ReadonlyArray<TriggerCategory> = [
  'ShopUpgrade',
  'StartTurn',
  'SpecialEndTurn',
  'Roll',
  'Roll3',
  'EndTurn',
  'ThisSold',
  'ThisBought',
  'FriendSold',
  'FriendBought',
  'Tier1FriendBought',
  'SpendGold',
  'SpendGold7',
  'FoodBought',
  'Eat',
  'Eat2',
];

// Utility getter for external code that prefers a typed lookup signature.
export const getAbilityPriority = (
  trigger: AbilityTrigger | string | null | undefined,
): number | undefined => {
  if (typeof trigger !== 'string' || trigger.length === 0) {
    return undefined;
  }
  if (isNumberedCounterTrigger(trigger)) {
    return ABILITY_PRIORITIES.CounterEvent;
  }
  return ABILITY_PRIORITIES[trigger];
};
