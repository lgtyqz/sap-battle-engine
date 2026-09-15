# Changelog

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
