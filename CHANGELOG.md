# Changelog

## 2026-09-18

### Fixed

- Prevented Macaque from copying ailments to its summoned Orangutan while
  continuing to copy perks.
- Made Chameleon's copied Peanut Jar ability activate at the start of battle,
  allowing Peanut Jar, Chameleon, and Puma to resolve as three separate perk
  grants like other perk-granting toys.
- Passed the intended defender through before-attack resolution for regular and
  jump attacks. Geechee Red Pea, Squash, Egg, and Golden Egg now affect the pet
  being attacked instead of incorrectly falling back to the front-most enemy.
  Perks with explicit targeting, such as Fig and Tomato, retain their own target
  selection.
- Applied Meerkat's level multiplier before rounding down its spent-gold
  scaling, preserving partial four-gold increments at higher levels.
- Applied Highland Cow's level multiplier before rounding down its health-based
  trumpet scaling, preserving partial three-health increments at higher levels.

### Added

- Added regression coverage for Macaque perk and ailment copying, separate
  Chameleon and Puma perk-toy activations, and defending-pet targeting by
  before-attack perks during jump attacks.

## 2026-09-17

### Fixed

- Made African Wild Dogs summoned by Takhi inherit Takhi's level so their jump
  damage scales correctly instead of always dealing 3 damage.
- Rounded Maple Syrup attack and defense damage up, and applied its reduction
  to ability, Chili, Crocodile, and toy snipes instead of bypassing it.
- Rounded Ibex's 70% health removal up without allowing it to remove the last
  health from a one-health target.
- Prevented a Pygmy Hog killed by the triggering attack or snipe from executing
  its queued Angry Pygmy Hog transformation.
- Made Banggai Cardinalfish consume Giant Otter's temporary attack before
  reducing base attack, preventing the temporary buff's later removal from
  reducing the target twice.
- Stopped fingerprinted random-decision overrides from falling back to an
  unrelated decision at the same index, fixing Blowfish capture and replay
  failures.
- Made Bombus Dahlbomii deal its damage directly during counter-ability timing
  instead of adding a second, incorrectly delayed callback.

### Changed

- Replaced the flat ability-priority table with canonical catalogs for the four
  battle phases and all 26 normal-order slots. Newly activated abilities now
  re-enter that order immediately.
- Ordered start-of-battle sources as Churros pets, toys, then other pets before
  normal reactions. Same-trigger pet abilities otherwise use higher attack
  first with random ties, while retaining the Churros and Macaron exceptions.
- Separated counter progress from counter execution. Enemy attacks, friend
  hurts, food events, faints, summons, and other pet-specific sources only
  increment their matching counters; completed counters queue a shared
  priority-18 `CounterEvent` that retains the numbered ability as its execution
  trigger. This places Mammoth's Faint before Wolverine's fourth-hurt ability
  and keeps Aye-Aye and other Danger Pack counters out of after-attack timing.
- Moved post-removal faint observers, including adjacent-friend faint events,
  until after the fainted pet disappears while preserving Kitsune's pre-removal
  exception. Empty Front Space and Golden Retriever checks now follow removal.
- Kept chained Parrot abilities input-defined through `parrotCopyPet` metadata;
  battle execution does not infer a new Parrot-to-Parrot copy.

### Added

- Added `PetConfig.plainCopy` support for named shop-created copies such as
  Shima Enaga. Plain copies retain identity, stats, and equipment without the
  named pet's native ability or randomness classification.
- Added focused catalog, counter timing, faint timing, start-of-battle ordering,
  damage-rounding, copy-metadata, randomness-capture, and engine regression
  coverage.

## 2026-09-15

### Fixed

- Restored the `Random` catalog metadata for 89 pets, 14 toys, and 18 foods so
  known-random battle configurations are not misclassified as deterministic.
- Ignored cosmetic simultaneous death-log ordering when probing battle
  determinism, while retaining detection of tied Faint and Friend Faints
  ability resolution.
- Monkey-Faced Bat 3 health -> 4 health.
- Serpent, Beluga, etc. are no longer considered Faint pets.

### Changed

- Made the fight optimizer probe each matchup for determinism. Deterministic
  matchups reuse the probe as their sole simulation, while random matchups
  retain the probe as their first sample before continuing to 15 or 50.

### Added

- Added `isBattleDeterministic(config)` and the reusable-engine equivalent for
  detecting known or encountered randomness after at most one battle.
- Added `engine.probeBattleDeterminism(config)` so callers can retain the
  instrumented probe result instead of simulating the same battle again.
- Added regression coverage for random pets, toys, equipment, mana fainting,
  Silly, equal-priority triggers, and erased randomness metadata.

## 2026-09-14

### Fixed

- Prevented Crane from granting Melon when the friend ahead fainted from the
  triggering hit.
- Made Silly targeting apply to every ability execution, including repeated
  summon abilities such as Sea Turtle's.
- Made positional range targeting count living pets instead of board slots, so
  abilities such as Firefly skip over fainted pets.
- Made Porcupine reflect damage to the enemy that actually hurt it by retaining
  the damage source through hurt-event resolution.
- Resolved before-attack perks during jump attacks. Tomato, Fig, Cocoa Bean,
  Chocolate Cake, and Marine Iguana now resolve before the jump attack lands.
- Restricted Bass to genuinely level-2 Sell friends. Pets with one experience
  remain level 1 and cannot receive its experience.
- Made Cuttlefish damage and apply Inked to the same eligible rear targets, and
  prevented Inked from reducing positive ability damage below one.
- Preserved attack and health across transformations by default, including Red
  Lipped Batfish transformations. Transformations that intentionally replace
  stats can opt out explicitly.
- Preserved Pygmy Hog stats when they exceed Angry Pygmy Hog's base stats while
  still raising weaker Pygmy Hogs to 5/5 and granting Garlic.
- Kept Basilisk's Rock transformation on its explicitly calculated replacement
  stats.
- Corrected Corncob handling so it feeds the lowest-stat side and triggers food
  abilities without replacing the pet's perk.
- Corrected Farmer Mouse, Chicken, Pig, Crow, Cat, and Dog Corncob effects,
  including Farmer Cat's missing buy ability and repeated feeds for scaled
  effects.
- Corrected Gelada's Pears to grant +2/+2 per feed and excluded its transformed
  Sleeping Gelada form from the recipients.
- Routed Pony's Better Apples through the same food-effect path so their +2/+2
  and food triggers resolve consistently.
- Made equipment-granting abilities search past any number of friends that
  already hold the granted perk, allowing Turtle, Tahr, Toucan, Snapping Turtle,
  and Painted Terrapin to reach valid friends farther back.
- Made Banggai Cardinalfish commit its attack assignment as non-temporary, so a
  preceding Giant Otter buff cannot remove that attack after the first
  non-jump attack.

### Changed

- Added shared `feedCorncob`, `feedPear`, and `feedBetterApple` effects for food
  granted by pet abilities instead of representing those feeds as equipment.
- Extended transformation calls with an explicit `preserveStats` option and
  made preservation the default.

### Added

- Added focused regression coverage for the observed Crane, Silly, Firefly,
  Porcupine, Farmer, Gelada, Pygmy Hog, transformation, jump-attack, and Bass
  behaviors.
- Added Bug Squisher fixture discovery, strict deterministic replay, browser
  checkpoint alignment, alignment unit tests, and imported regression fixtures.
- Added deterministic completion of truncated capture tapes: the recorded tape
  prefix is verified against the fixture seed before one complete battle is
  replayed strictly.
- Documented the Bug Squisher validation workflow and the handling of incomplete
  and candidate captures in `VALIDATION.md` and the fixture README.
