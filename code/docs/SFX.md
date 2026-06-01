# SFX, Music, and Ambience Plan

This document lists the sound assets still needed for **G.L.O.S.S.A.R.Y.** and the folder structure to keep them organized.

---

## Asset Folder Structure

```text
public/assets/
├── ambience/
│   ├── hub/
│   ├── biomes/
│   │   ├── desert/
│   │   ├── abandoned/
│   │   └── mechanic/
│   ├── merchant/
│   └── summit/
├── music/
│   ├── menu/
│   ├── exploration/
│   ├── combat/
│   ├── boss/
│   └── stingers/
└── sfx/
    ├── ui/
    ├── glossary/
    ├── movement/
    │   ├── dash/
    │   └── footsteps/
    ├── exploration/
    │   ├── interactions/
    │   ├── items/
    │   └── doors/
    ├── world/
    │   ├── chains/
    │   └── impacts/
    ├── transitions/
    │   ├── teleport/
    │   └── portal/
    ├── combat/
    │   ├── runes/
    │   ├── hits/
    │   └── status/
    ├── enemies/
    ├── bosses/
    │   └── summit/
    └── merchant/
```

### Current Files

```text
public/assets/sfx/ui/click.mp3
public/assets/sfx/movement/dash/whoosh-1.mp3
public/assets/sfx/movement/dash/whoosh-2.mp3
public/assets/sfx/movement/dash/whoosh-3.mp3
public/assets/sfx/movement/dash/whoosh-4.mp3
public/assets/sfx/movement/dash/whoosh-5.mp3
public/assets/sfx/world/rumble.mp3
public/assets/sfx/world/impacts/rocks.mp3
public/assets/sfx/world/chains/chains-1.mp3
public/assets/sfx/world/chains/chains-2.mp3
public/assets/sfx/world/chains/chains-3.mp3
public/assets/sfx/world/chains/chains-4.mp3
public/assets/sfx/transitions/teleport/teleport-whoosh-1.mp3
```

---

## Naming Conventions

- Use lowercase kebab-case: `rune-select-1.mp3`, `door-stone-open-2.mp3`.
- Number variants with `-1`, `-2`, `-3` for random pitch/selection variety.
- Keep short one-shot SFX in `sfx/`.
- Keep looping environmental beds in `ambience/`.
- Keep composed themes and combat loops in `music/`.

---

## Priority Order

1. Footsteps by surface.
2. Combat hit, cast, and enemy death sounds.
3. Glossary, book, page, and rune unlock sounds.
4. Raidho rune charge and activation sounds.
5. Biome ambience loops.
6. Boss attack sounds.
7. Menu and covenant polish sounds.
8. Full music loops after the game feel is stable.

---

## UI / Menus

- Main menu hover: soft rune tick or paper flick.
- Main menu select: heavier stone/rune confirm.
- Back/cancel: low reversed click.
- Settings slider move: tiny mechanical tick.
- Settings toggle: small switch/clack.
- Multiplayer room create: magical stamp or seal sound.
- Join room success: bright rune chime.
- Join room fail: dull error thud.
- Room list refresh: subtle parchment shuffle.
- Covenant card hover: low aura shimmer.
- Covenant lock-in: covenant-specific burst.
- All players ready: rising ritual chime.

Suggested folder: `public/assets/sfx/ui/`

---

## Glossary / Book

- Open Glossary: heavy old book open.
- Close Glossary: book close or soft slam.
- Page turn: parchment flip.
- Tab switch/bookmark: leather tab snap.
- Rune discovered entry: magical ink write.
- Bestiary/item/location unlocked: soft recorded chime.
- Locked entry hover: faint chain rattle.
- Slate fragment pick up: stone scrape.
- Slate fragment place: stone socket click.
- Slate solved: ancient phrase reveal or choir shimmer.

Suggested folder: `public/assets/sfx/glossary/`

---

## Exploration

- Player footsteps: separate variants for stone, sand, wet/swamp, and metal.
- Dash: covenant-specific dash whoosh.
- Player hurt: short impact grunt or energy crack.
- Player death: shadow collapse.
- Interact prompt appear: small rune ping.
- Hold interact progress: rising hum.
- Interaction complete: confirm pulse.
- Chest open: wood/stone creak plus sparkle.
- Item pickup: small magical pickup.
- Gemstone pickup: crystal tinkle.
- Door open: stone scrape or hinges.
- Door locked: dull knock.
- Mechanic door open/close: gears, chain, piston.
- Portal enter: spatial whoosh.
- Portal exit: reverse shimmer.
- Location reveal: wide atmospheric sting.

Suggested folders:

```text
public/assets/sfx/movement/footsteps/
public/assets/sfx/movement/dash/
public/assets/sfx/exploration/interactions/
public/assets/sfx/exploration/items/
public/assets/sfx/exploration/doors/
public/assets/sfx/transitions/portal/
```

---

## Hub / Raidho Rune

- Raidho idle hum when charged.
- Raidho 1 pipe charged: faint pipe energy.
- Raidho 2 pipes charged: stronger harmonic hum.
- Raidho fully charged: looping rune resonance.
- Raidho not ready interaction: cold stone thud.
- Raidho activation hold: rising tonal charge.
- Raidho teleport: bright white flash and ascending whoosh.
- Floor advance: deep tower movement rumble.
- Hub door reset/open: heavy ancient mechanism.

Suggested folders:

```text
public/assets/sfx/exploration/interactions/
public/assets/sfx/transitions/teleport/
public/assets/sfx/world/impacts/
```

---

## Combat

- Combat start transition: battle swell or rune snap.
- Turn start: short initiative cue.
- Rune card hover: magical flick.
- Rune select: symbol pluck.
- Rune chain build: linked rune ticks.
- Rune chain invalid: broken glyph crackle.
- Attack confirm: sharp magical cast.
- Basic hit: impact variants.
- Critical hit: bigger impact plus bright sting.
- Shield block: glass/ward impact.
- Heal: warm rising shimmer.
- Status applied: magical seal stamp.
- Status tick: poison, burn, freeze, and slow tick cues.
- Enemy hurt: creature-specific hits.
- Enemy death: dissolve, bone collapse, slime splat, or dust burst.
- Victory: short reward fanfare.
- Defeat: dark falloff.

Suggested folders:

```text
public/assets/sfx/combat/runes/
public/assets/sfx/combat/hits/
public/assets/sfx/combat/status/
public/assets/music/stingers/
```

---

## Enemies

- Slime idle: wet squish loop.
- Slime attack: splat lunge.
- Skeleton/bones idle: bone rattle.
- Skeleton attack: dry slash.
- Rat attack: bite/scratch.
- Bat movement: wing flutter.
- Crab attack: claw snap.
- Golem idle: stone grind.
- Golem attack: heavy slam.
- Wisp/cultist/rationalist if used: ghost hum, chant, sharp magic pulse.

Suggested folder: `public/assets/sfx/enemies/`

---

## Boss / Summit

- Boss encounter start: huge low sting.
- Tentacles rise: wet stone rupture.
- Tentacles retract: suction/drag.
- Boss eye open: organic blink plus bass hit.
- Boss eye idle ambience: low pulsing drone.
- Pillar rise: stone lift/rumble.
- Pillar fall: heavy crash.
- Small pillar attack: fast stone burst.
- Inline pillar attack: line sweep rumble.
- Spike rise: sharp stone spikes.
- Boss damaged: massive fleshy/stone hit.
- Boss defeated: long collapse, chains, silence break.
- Glossary/Beholder final choice: ominous heart pulse.

Suggested folders:

```text
public/assets/sfx/bosses/summit/
public/assets/ambience/summit/
public/assets/music/boss/
```

---

## Merchant / Trade

- Merchant appear: cloth shimmer or portal whisper.
- Shop open: curtain/wooden stall creak.
- Card carousel move: card slide.
- Trade hover: coin/rune tick.
- Buy success: coin drop plus magic seal.
- Buy fail/no currency: empty pouch clink.
- Item inspect: parchment unfold.

Suggested folder: `public/assets/sfx/merchant/`

---

## Ambience

- Main menu room tone: quiet magical static.
- Multiplayer lobby: subtle pulse, distant room tone.
- Covenant selection: ritual bed with three quiet covenant motifs.
- Central Hub: ancient tower hum, distant wind, pipe resonance.
- Desert settlement: dry wind, sand, distant stone creaks.
- Abandoned/swamp settlement: water drips, insects, hollow ruins.
- Mechanic settlement: gears, chains, steam, low machinery.
- Merchant hub: strange cozy extradimensional loop.
- Summit: high-altitude wind, heart/eye pulse, unstable magic.

Suggested folder: `public/assets/ambience/`

---

## Music

- Main menu theme: mysterious title loop, sparse melody.
- Covenant selection music: ritual loop.
- Exploration loop: light adaptive bed for non-combat maps.
- Combat loop: normal encounter music.
- Boss trial music: heavier biome-specific loop.
- Final boss music: layered tension, choir/noise, unstable rhythm.
- Victory sting: short reward phrase.
- Game over sting: short dark reprise.

Suggested folder: `public/assets/music/`
