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
Movement
Footstep Stone
Footstep Dirt/Sand
Dash
Hurt
Death

5 sounds

Interactions
Interact
Confirm
Item Pickup
Chest Open
Door Open
Portal

6 sounds

UI
Hover
Select
Back
Error

4 sounds

Combat
Rune Select
Cast
Hit
Critical Hit
Block
Heal
Enemy Hurt
Enemy Death
Victory

9 sounds

Raidho
Charged Hum
Activation Charge
Teleport

3 sounds

Glossary
Open
Page Turn
Unlock Entry

3 sounds

Ambience

Only one loop per biome:

Hub
Desert
Swamp
Mechanic
Summit

5 loops

Boss
Encounter Start
Eye Open
Pillar Attack
Spike Attack
Boss Hurt
Boss Death

6 sounds
