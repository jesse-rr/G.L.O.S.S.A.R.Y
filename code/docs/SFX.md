# SFX, Music, and Ambience Plan

This document lists the audio assets required for **G.L.O.S.S.A.R.Y.** during the current production phase. The focus is on essential gameplay feedback, ambience, and boss encounters while keeping the audio scope manageable.

---

# Asset Folder Structure

```text
public/assets/
├── ambience/
│   ├── hub/
│   ├── desert/
│   ├── swamp/
│   ├── mechanic/
│   └── summit/
└── sfx/
    ├── ui/
    ├── glossary/
    ├── movement/
    │   ├── footsteps/
    │   └── dash/
    ├── interactions/
    ├── combat/
    ├── raidho/
    └── bosses/
```

---

# Current Files

```text
public/assets/sfx/ui/click.mp3

public/assets/sfx/movement/dash/
├── whoosh-1.mp3
├── whoosh-2.mp3
├── whoosh-3.mp3
├── whoosh-4.mp3
└── whoosh-5.mp3

public/assets/sfx/world/
├── rumble.mp3
├── impacts/rocks.mp3
└── chains/
    ├── chains-1.mp3
    ├── chains-2.mp3
    ├── chains-3.mp3
    └── chains-4.mp3

public/assets/sfx/transitions/teleport/
└── teleport-whoosh-1.mp3
```

---

# Naming Conventions

* Use lowercase kebab-case.
* Example: `rune-select-1.mp3`
* Example: `footstep-stone-2.mp3`
* Example: `boss-death-1.mp3`
* Use numbered variants (`-1`, `-2`, `-3`) when multiple versions exist.
* Keep one-shot effects in `sfx/`.
* Keep looping environmental sounds in `ambience/`.

---

# Priority Order

1. Footsteps by surface.
2. Combat hit, cast, and enemy death sounds.
3. Glossary open, page turn, and unlock sounds.
4. Raidho charge and teleport sounds.
5. Biome ambience loops.
6. Boss attack sounds.
7. UI polish and menu sounds.

---

# Required Audio Assets

## Movement

Folder: `public/assets/sfx/movement/`

### Footsteps

* footstep-stone
* footstep-dirt

### Movement Actions

* dash
* player-hurt
* player-death

**Total: 5 Sounds**

---

## Interactions

Folder: `public/assets/sfx/interactions/`

* interact
* confirm
* item-pickup
* chest-open
* door-open
* portal

**Total: 6 Sounds**

---

## UI

Folder: `public/assets/sfx/ui/`

* hover
* select
* back
* error

**Total: 4 Sounds**

---

## Combat

Folder: `public/assets/sfx/combat/`

* rune-select
* cast
* hit
* critical-hit
* block
* heal
* enemy-hurt
* enemy-death
* victory

**Total: 9 Sounds**

---

## Raidho

Folder: `public/assets/sfx/raidho/`

* charged-hum
* activation-charge
* teleport

**Total: 3 Sounds**

---

## Glossary

Folder: `public/assets/sfx/glossary/`

* glossary-open
* page-turn
* unlock-entry

**Total: 3 Sounds**

---

## Ambience

Folder: `public/assets/ambience/`

### Hub

* hub-loop

### Desert

* desert-loop

### Swamp

* swamp-loop

### Mechanic

* mechanic-loop

### Summit

* summit-loop

**Total: 5 Loops**

---

## Boss

Folder: `public/assets/sfx/bosses/`

* encounter-start
* eye-open
* pillar-attack
* spike-attack
* boss-hurt
* boss-death

**Total: 6 Sounds**

---

# Summary

| Category           |  Count |
| ------------------ | -----: |
| Movement           |      5 |
| Interactions       |      6 |
| UI                 |      4 |
| Combat             |      9 |
| Raidho             |      3 |
| Glossary           |      3 |
| Boss               |      6 |
| **Total SFX**      | **36** |
| **Ambience Loops** |  **5** |

This represents the minimum audio package required to achieve strong gameplay feedback and atmosphere while avoiding unnecessary production overhead during active development.
