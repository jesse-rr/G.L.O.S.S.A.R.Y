# G.L.O.S.S.A.R.Y. - Project Documentation
**Author:** Jesse Ricardo Rogerio

## 1. Overview

### The Elevator Pitch
A multiplayer exploration turn-based RPG where 1-3 players journey through distinct fractured realms, gather ancient knowledge, and unite to defeat a mythical god.

### Project Description (Detailed)
G.L.O.S.S.A.R.Y is a 2D exploration, turn-based multiplayer game with a Top-Down Pixel Art perspective. The player assumes the role of **The Shadow** — an undefined being seeking identity through ancient knowledge and ascension.

The core gameplay revolves around exploring distinct maps (Desert, Abandoned, Mechanic), interacting with settlements, and finding written knowledge in the form of symbols that act as powerful abilities and effects. Players must conquer their respective middle bosses before joining forces in a final, conjoined battle against an ultimate endgame boss.

The **Glossary system** records these discovered symbols, enemies, and knowledge. However, defeat at the hands of a boss resets the player and costs them a portion of this recorded knowledge (returning them to silhouettes).

### Run Structure & Progression
- **Multiplayer:** 1-3 players.
- **Lives:** Each player has 3 lives.
- **Covenants:** Players choose a Covenant defining their ability (e.g., Recursion, Domination, or Sacrifice) and unique resource currency.
- **Map Distribution:** Each player explores a different, randomized map (Mechanic, Desert, or Abandoned).
- **End State:** The game ends after the final conjoined boss fight at the Summit.
- **Knowledge-Based Progression:** Players must explore settlements and find treasures to gain lost knowledge. Gathering this knowledge is mandatory to challenge the bosses. If a player loses to a middle boss, they respawn until they win but lose some knowledge (contents of their glossary).

---

## 2. Theme / Setting / Genre

| Category | Description |
| :--- | :--- |
| **Theme** | A search for Identity through lost knowledge and cooperative ascension. |
| **Setting** | A mythological world featuring a Central Hub and distinct realms: Desert, Abandoned, and Mechanic. The journey culminates at the Summit. |
| **Genre** | Exploration / Turn-Based RPG / Multiplayer |
| **Visual Style** | Glowing Runes, Glitchy Distortions, Dungeon Stone Architecture, Dark Lighting, Top-Down Pixel Art. |

---

## 3. Core Gameplay Mechanics

### The Central Hub
The Hub presents players with three distinct paths:
- **Left:** Leads to a Settlement.
- **Right:** Leads to unknown exploration areas or mysteries.
- **Top:** Leads to the Boss room.

### Map & Settlement Exploration
- **Realms:** Desert, Abandoned, and Mechanic maps. Each contains a Settlement and a Boss.
- **Settlement Activities:**
  - Talk to NPCs to gather lore and information.
  - Find treasures and Relics to acquire essential lost knowledge. Completing the settlement exploration is required to challenge the boss.
  - **Monoliths:** Ancient stones (Big and Small Ritualistic) embedded with runes. Clicking a monolith triggers a battle in an alternative reality. Winning grants the rune into the player's arsenal. At least one monolith battle exists per settlement, and these fights can be replayed.
  - **Merchant:** A trader who buys and sells runes and items in exchange for Gemstones (the game's currency, obtained from battles, chests, and exploration).

### Combat & Runes
- **Turn-Based Battles:** The player acts first, followed by the enemy. Chains cannot be interrupted except by rare status effects.
- **Rune Chain Construction:** Players draw up to 7 Runes in their hand and can construct a linear Chain of 1–7 Runes. 
- **Translations & Execution:** Each Rune has a "Translation" (e.g., Strength increases damage, Pierce ignores defense, Echo repeats an effect). Order matters: effects resolve strictly left to right, with earlier runes modifying the later ones. There are no branching paths.
- **Identified vs. Unidentified Runes:**
  - *Unidentified:* Found on maps and have a chance to fail (no effect or reduced effect) during combat. The failure rate increases as difficulty scales.
  - *Identified:* Once won in a Monolith battle, its Translation is permanently revealed. Identified runes never fail and operate at full strength.
- **Relics:** Players can equip up to 3 active Relics at once. These modify gameplay (e.g., altering rune behavior, increasing hand efficiency, amplifying covenant currency).

### Multiplayer Boss Progression
- **Middle Bosses:** Each player must conquer the boss of their respective map.
- **Reality Fracturing:** Whenever a player successfully defeats their middle boss, the shared world experiences a sudden tremor and begins to visually glitch. This effect represents reality shifting and destabilizing—akin to the fracturing of the Tower of Babel—as the players approach ascension.
- **The Summit (Endgame):** Once all players defeat their middle bosses, they travel to the Summit. Here, they enter a conjoined cooperative battle against an endgame boss of their choice (Phoenix, Dragon, or Snake).

### Covenant Selection
At the start, players choose a philosophy which dictates their unique ability and how they generate their resource currency:
- **Coil (Recursion):** Uses *Echoes* (gained by identifying symbols/runes). Ability: Rewind.
- **Crown (Dominance):** Uses *Blood* (gained through sacrificial kills or decisive actions). Ability: Command Enemy (turns an enemy into a temporary ally).
- **Ash (Sacrifice):** Uses *Fire* (gained through enemy defeat and destructive actions). Ability: Revive.
*Players can activate these abilities during their turn once sufficient currency is accumulated.*

---

## 4. Targeted Platforms & Monetization

- **Platform:** PC (Multiplayer focus).
- **Model:** Premium (One-time purchase). No microtransactions.

---

## 5. Influences

- **Slay the Spire:** Major influence on the turn-based combat system, rune chain (deck) construction, and the run-based structure where knowledge is gathered over time.
- **Hyper Light Drifter:** Heavy inspiration for the assets feeling, atmospheric visual storytelling, vibrant maps, and a sense of mysterious, ancient technology mixed with mythical elements.
- **Tunic:** Inspiration for the hidden knowledge system, manual-based discovery, and piecing together a language using a book (the Glossary) as it updates.
- **Cooperative Multiplayer Games:** Shared endgame goals and conjoined boss fights.
- **Mythology:** Concepts of ancient knowledge, runes, and divine beasts (Phoenix, Dragon, Snake).
- **Babylon & The Tower of Babel:** Inspiration for the thematic loss of knowledge, the fracturing of reality, and the quest to reclaim lost meaning.

---

## 6. Story & Atmosphere

### Detailed Narrative
The Shadows awaken in the Central Hub, seeking purpose and identity. Through a physical **Glossary**, they record the reality they uncover. They must venture into three distinct realms—a desolate Desert, an Abandoned wasteland, and a Mechanic labyrinth—each harboring lost knowledge and powerful runes.

As they uncover symbols and interact with the remnants of these worlds within Settlements, they rebuild their understanding of the world. After conquering the guardians of these realms, the Shadows unite at the Summit to face a mythical being (Phoenix, Dragon, or Snake) to achieve ultimate ascension.

---

## 7. Assets Needed

Based on the `public/assets/exports` directory and original concepts, the assets are separated into the following categories:

### UI
- HUD elements, Glossary Pages, Menus, Achievement popups, Settings, Help Page, Etc...
- Folder: `UI`
- Fonts & XMLs (`VCRosdNEUE.ttf`, `VCRosdNEUE.png`, `VCRosdNEUE.xml`).

### Characters
- **Protagonist:** The Shadow (Sprites for 1-3 players).
- **NPCs:** Merchant (with Abandoned Campsite/Tent).
- Folder: `characters`
- Models: `cat.glb` (3D model reference/misc character).

### Bosses & Enemies
- **Middle Bosses:** Guardians of the Desert, Abandoned, and Mechanic maps.
- **Endgame Bosses:** Phoenix, Dragon, Snake.
- **Basic Enemies:** Green/Blue Slimes, Stone/Runic Golems, Hooded/Zealous Cultists, Faint/Soul Wisps, Dungeon Scavenger, Carrion Stalker.
- Folder: `Boss`

### Effects & Objects
- **Objects:** Treasures, chests, Monoliths (Big and Small Ritualistic), items, Runes (Glowing in different colors for each biome), flags, hanging chains, torches.
- Folder: `Objects`
- **Misc:** Miscellaneous visual effects and audio (e.g., `cat-meme.mp3`).
- Folder: `misc`

### Environments & Maps
- **Maps:** Layouts for Central Hub, Desert, Abandoned, Mechanic realms, and The Summit.
- Folder: `Maps`
- **Tilesets:** Stone architecture (Cracked, Runic, Shifted, Rocky), Walls (Carved, Wrap Around), Broken Columns, Broken Staircases, Vines, Mushrooms, Fireflies. 
- Folder: `tileset`
- **Backgrounds:** Environments for battle scenes, alternative realities, and exploration.
- Folder: `backgrounds`

### Animations
- Combat effects, movement cycles, environment animations.
- Folder: `Animations`

### Audio & Sound Design
- **Ambient:** 
  - *Desert/Lower Areas:* Dungeon themes, dark ambiance, water droplets, winds.
  - *Abandoned/Mid Areas:* Rainy, puddles, winds, birds.
  - *Mechanic/Upper Areas:* Mechanical grinding, pumps, geysers, hot water.
- **Combat/Interactions:** Hit/collision sounds, injured/death sounds, 3 unique Boss Themes (Coil, Ash, Crown).

### Covenants
- **Covenant:** Icons, visual effects, and UI specific to Coil, Crown, and Ash choices.
- Folder: `Covenant`

---

## 8. Schedule and Milestones

### Milestone 1: Core Foundation of Assets/Code
- Develop the core foundational architecture.
- Integrate initial assets including maps, character sprites, and base animations.
- Set up multiplayer networking (1-3 players) and the Central Hub environment.

### Milestone 2: Ambiance and Environment Polish
- Implement collision systems across all maps.
- Add environmental effects like slow movement zones, vignette effects, and overall ambiance adjustments.
- Ensure the aesthetic of the Desert, Abandoned, and Mechanic maps matches the desired mood.

### Milestone 3: Combat System
- Fully flesh out the turn-based combat system.
- Implement the Monolith "alternative reality" battle system.
- Integrate the Glossary, Runes, and Knowledge system into active gameplay.

### Milestone 4: Multiplayer Progression & Bosses
- Fully integrate the 1-3 player cooperative experience.
- Implement all middle bosses and the conjoined endgame bosses (Phoenix, Dragon, Snake).
- Implement the death penalty system and the mandatory settlement exploration logic.

### Milestone 5: Music & SFX
- Implement background music for maps, battles, and the Hub.
- Add sound effects for combat, UI interactions, environment ambience, and the Merchant/NPC interactions.

### Milestone 6: Polishing
- Final audio balancing, combat tuning, and UI polishing.
- Comprehensive bug fixing across all maps and multiplayer states.
- Final playtesting and optimization for a smooth PC release.

---

## 9. Team & Roles

- **Lead Developer & Game Designer:** Jesse Ricardo Rogerio
  - Architecture, Multiplayer Networking, Core Combat Systems, UI/UX, and Game Logic.
- **Artist & Animator:** Jesse Ricardo Rogerio
  - Pixel art, tilesets, environments, character sprites, and animations.
- **Audio & Sound Design:** Jesse Ricardo Rogerio
  - SFX generation, ambient soundscapes, and combat feedback.

*(Note: As a solo developer project or core team, roles are consolidated to ensure a cohesive vision across all mechanics.)*