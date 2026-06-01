# G.L.O.S.S.A.R.Y. - Lore, Narrative, & Flow Design

This document details the atmospheric narrative structure, opening prologue flow, player spawn animation, post-combat lore delivery, and biome progression tracking systems for **G.L.O.S.S.A.R.Y.**

---

## 1. Narrative Core & Philosophy
**G.L.O.S.S.A.R.Y.** embraces a **silent, environmental storytelling philosophy**. The world is heavy, ancient, and fractured. There are no expansive dialogues or chatting NPCs. Instead, the story is drip-fed directly to players through:
* **Decaying World Biomes**: Visually distinct ruins (Desert, Abandoned, Mechanic) that imply a lost unified age.
* **The Glossary Lore Book**: A physical record that unlocks drawings, names, and poetic fragments as players defeat guardians and collect relics.
* **The Scramble Reveals**: Unidentified runic symbols programmatically reorganizing themselves into words of power, indicating the reconstruction of language.

---

## 2. The Silent Prologue: "The Fracturing of Babel"
A slideshow scene that launches immediately after players lock in their Covenants, bridging the waiting room and the active exploration map.

```mermaid
graph TD
    A["Slide 1: Unity"] -->|Runic: 🜂🜄🜁 $\rightarrow$ UNITY| B["Slide 2: Fracture"]
    B -->|Runic: 🜏🜐🜑 $\rightarrow$ FRACTURE| C["Slide 3: Dissolution"]
    C -->|Runic: 🜔🜕🜖 $\rightarrow$ SILENCE| D["Slide 4: Awakening"]
    D -->|Runic: 🜛🜜🜝 $\rightarrow$ SHADOW| E["Level Map Spawn"]
```

### Visual & Textual Panel Flow
* **Panel 1: The Golden Age of Language**
  * **Visual**: A massive, gleaming white tower (The Summit) rising into space, surrounded by complex geometric lines of light representing a unified language spoken by all.
  * **Audio**: A resonant, peaceful ambient bell note.
  * **Text Scramble**: `🜂🜄🜁` $\rightarrow$ `U N I T Y`
* **Panel 2: The Celestial Crack**
  * **Visual**: A jagged, obsidian crack slices through the tower. Waves of runic letters spill out like burning blood, shooting down into three distinct, decaying realms.
  * **Audio**: A sudden, low-frequency sub-bass rumble paired with a visual screen shake.
  * **Text Scramble**: `🜏🜐🜑` $\rightarrow$ `F R A C T U R E`
* **Panel 3: The Loss of Form**
  * **Visual**: The inhabitants of the tower dissolving into drifting, faceless black silhouettes. Their glowing mouthpieces are sealed, and the language floats away.
  * **Audio**: High-pitched, whispering glitch sounds panning left to right.
  * **Text Scramble**: `🜔🜕🜖` $\rightarrow$ `S I L E N C E`
* **Panel 4: The Wake of Meaning**
  * **Visual**: A single black shadow (the player) slowly sitting up in the crumbling dust of the Central Hub, looking towards the distant, empty Summit above.
  * **Audio**: Exploration synth pad fades in.
  * **Text Scramble**: `🜛🜜🜝` $\rightarrow$ `S H A D O W`

---

## 3. The Player Spawn Ritual: "Shadow Coalescence"
When transitioning from the prologue or loaded files into any exploration map, the player's avatar does not simply appear; they are physically formed from the world.

### Spawning Step-by-Step Sequence
1. **Camera Lock & Fog**: The map fades in, but the screen is slightly darkened by a heavy vignette. The camera is locked onto the player's spawn point.
2. **Rising Pool**: A circular puddle of shifting, liquid black shadow rises up from the stone floor (using a scaling sprite animation).
3. **Covenant Core Ignition**: A bright, central spark of energy ignites inside the shadow pool, colored specifically to the player's Covenant:
   - **Dragon**: Vibrant Orange / Gold.
   - **Phoenix**: Luminous Red / Magenta.
   - **Snake**: Emerald Green.
4. **Ascension**: The shadow pool is pulled upwards, stretching into the silhouette of the player's character while absorbing the colored core.
5. **Tremor Release**: A subtle camera shake triggers, releasing a soft blast of particles of the player's Covenant color. Exploration controls are enabled, and the character is free to move.

---

## 4. The Post-Combat "Rune Revelation"
To ensure every monolith battle victory feels monumental, the transition back to the map is replaced by a cinematic, rewarding lore delivery screen.

```
 [Monolith Defeated] ──> [Glitch Transition] ──> [Obsidian Dark Screen]
                                                         │
                                               Unlocking Rune floats in center,
                                            scramble-reveals its name/translation,
                                            & displays a 1-sentence poetic riddle.
                                                         │
 [Return to Map] <── [Player Sprite Flashes] <── [Spacebar: Rune Absorbed]
```

### The Revelation Interface Details
* **The Presentation**: The map vanishes into an absolute pitch-black void.
* **The Rune Focus**: The glowing card representation of the rune won in combat (e.g., **F** - *Fyre* or **C** - *Cipher*) floats in the exact center of the screen, pulsing with active energy.
* **The Translation Scramble**: Runic symbols rotate around the card, rapidly scrambling before locking into the clean translated English words:
  - Example: `🜂  A E T H E R  -  S T R E N G T H`
* **Poetic Lore Cards**: A single, beautifully stylized line of text fades in at the bottom. These lines represent historical fragments of the Tower of Babel's fall:
  - **Aether (A)**: *"Titan bones ground into the foundation of the tower, dreaming of heaven's collapse."*
  - **Basalt (B)**: *"The vanguard stood firm against the sky, turning their backs to the god they built to serve."*
  - **Cipher (C)**: *"A truth so sharp it ignores the shields of kings, spoken in a tongue that has no word for fear."*
  - **Fyre (F)**: *"The primordial spark was banished to the grinding deep, waiting for the mouth that could bear its heat."*
  - **Rime (R)**: *"An absolute winter locked in the mechanic heart, slowing the passage of all things to a crawl."*
* **The Collection**: When the player presses `SPACEBAR`, the rune card shatters into glowing colored light streams that pull directly into the center of the HUD, updating the Glossary permanently.
* **The Return**: The screen glitches back to the explore map. The player's sprite emits a colored runic pulse for 1 second, confirming the new power is successfully bound.

---

## 5. Biome Progression: "The Sockets of Babel"
To challenge a biome's middle boss and ascend closer to the Summit, players must complete **3 monolith battles per map (9 battles in total across the 3 Biomes)**. This progression is tracked cleanly and atmospheric on the main exploration HUD.

### HUD Sockets: The Triptych Sockets
Directly beneath the player's health bar in the explore HUD, three carved stone sockets represent the biome's progress:

| Active Biome Battles | HUD Indicator State | Narrative Meaning |
| :--- | :--- | :--- |
| **0 of 3 Completed** | `[ ◯ ] [ ◯ ] [ ◯ ]` (Three grey, hollow stone slots) | Biome guardian is dormant. |
| **1 of 3 Completed** | `[ ● ] [ ◯ ] [ ◯ ]` (First slot ignites with biome runic light) | First seal broken; world hums. |
| **2 of 3 Completed** | `[ ● ] [ ● ] [ ◯ ]` (Second slot ignites; screen slightly trembles) | Second seal broken; reality shifts. |
| **3 of 3 Completed** | `[ ● ] [ ● ] [ ● ]` (All slots ignite; golden glint wave pulses) | Seals shattered; **Middle Boss Unlocked**. |

### The Boss Gate Event
When the third socket is activated in any biome:
1. The camera smoothly pans away from the player to show the giant stone boss portal or door on the map.
2. The door's heavy chains shatter and fall (using the `chain-link` frame sheet assets).
3. The gate erupts with glowing runic smoke, and the camera returns to the player.
4. The player can now step through to initiate the middle boss combat phase.

---

## 6. Campaign Structure Outline

```
                     [ COVENANT Waiting Room ]
                                │
                        [ SILENT Prologue ]
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  [ Desert Realm ]     [ Abandoned Realm ]    [ Mechanic Realm ]
   ├─ Monolith 1        ├─ Monolith 1          ├─ Monolith 1
   ├─ Monolith 2        ├─ Monolith 2          ├─ Monolith 2
   ├─ Monolith 3        ├─ Monolith 3          ├─ Monolith 3
   └─ Dragon Boss       └─ Phoenix Boss        └─ Snake Boss
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                          [ THE SUMMIT ]
                                │
                  [ Co-op / PVP End Game Duel ]
```
