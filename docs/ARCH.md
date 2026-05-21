# Architecture & Folder Structure

This document outlines the architecture, systems, and folder layout of **G.L.O.S.S.A.R.Y.**

---

## Folder Directory Details

### 📂 Root Directory
* `lobby-server.js` - A lightweight Node.js Express/HTTP server used for P2P multiplayer matchmaking and room discovery. Handles heartbeats and cleans up stale room listings.
* `package.json` - Project metadata, build commands, and npm script dependencies.
* `index.html` - The HTML entry point for the Vite bundler.

---

### 📂 src/game (Core Setup)
The primary source code built with Phaser 3 and TypeScript.
* `main.ts` - Instantiates the global Phaser Game configuration. Registers all scenes and configures `Scale.FIT` for viewport responsiveness.
* `constants.ts` - Houses design tokens, HSL palette mapping, control layouts (`InputKeys`), frame boundaries, and typography.
* `types.ts` - Shared typescript interfaces and type definitions (e.g. `CovenantType`, depths, speed vectors).
* `AssetRegistry.ts` - Strongly-typed static dictionaries mapping strings to textures, tilemaps, animations, and sound effects to prevent magic-string asset errors.
* `EventBus.ts` - Global custom event bus orchestrating decoupled state communication across scenes.
* `NetworkManager.ts` - Decoupled WebRTC P2P multiplayer networking manager (using PeerJS) for low-latency syncing of positions, active rune chains, and covenant selections.

---

### 📂 src/game/data (State Management)
State engines implemented as singletons that preserve progression and manage local storage.
* `BestiaryData.ts` - Tracks discovered enemies and manages bestiary details.
* `ItemData.ts` - Catalog of the 12 collectible items, buying cost, rarity tiers, and description lore.
* `LocationData.ts` - Tracks visited settlements, boss maps, and unlocked portal coordinates.
* `MultiplayerData.ts` - Synced lobby settings, room tokens, and shared network states.
* `PlayerData.ts` - Core attributes of the player (HP, maxHP, Covenants, Gemstones, active stat trades, and inventory).
* `RuneData.ts` - Manages the player's runic vocabulary, discoveries, and combinatorial chain resolver calculations.
* `UserData.ts` - Tracks achievements, control mappings, audio levels, and permanent player unlocks.

---

### 📂 src/game/combat (Combat Core Engine)
Encapsulates all logic and interfaces relating to combat.
* `CombatSystem.ts` - Central math and phase state machine. Processes rounds, status effects, damage calculations, and Covenant ability expenditures.
* `CombatHUD.ts` - Manages the combat screen text displays, combat phase banners, HP/shield bars, and real-time damage formula previews.
* `StatusEffectUI.ts` - Renders interactive, animated status badges above players and enemies indicating stacks, durations, and mechanics on hover.

---

### 📂 src/game/systems (Game Exploration & UI Systems)
Reusable modules representing dedicated interactable game components.
* `BossButtonSystem.ts` - Spawns and manages interactive boss challenge triggers at the end of exploration maps.
* `ChestSystem.ts` - Processes environmental chest interactions, opening animations, and gemstone reward distribution.
* `CollisionParser.ts` - Parses complex polyline, polygon, ellipse, and rectangle physics boundaries from Tiled JSON directly into Matter.js bodies.
* `DoorSystem.ts` - Renders, animates, and controls locked gates, hold-to-interact sensors, and portal triggers.
* `InteractSystem.ts` - Manages exploration prompts (e.g., "?" or "[E] Interact") that pop up near chests, doors, and NPCs.
* `LightSystem.ts` - Integrates ambient environment overlays representing a long, gradual day/night cycle.
* `PlayerPanelSystem.ts` - UI panel showing co-op allies, active status effects, and currently constructed rune chains.
* `PortalSystem.ts` - Manages map traversal gates and spatial transition triggers.
* `RunePickerSystem.ts` - Implements the circular rune picking deck, hand scaling, combo resolution visual effects, and chain locking.
* `TradeSystem.ts` - Powers the interactive trading card carousel interface where players purchase permanent stat upgrades using Gemstones or Special Currency.

---

### 📂 src/game/utils (Lightweight Helpers)
* `AchievementNotification.ts` - Formats overlay banners celebrating new discoveries.
* `Cat.ts` - Easter egg cat character logic.
* `GeometryUtils.ts` - Mathematical utilities enforcing clockwise winding coordinates for Matter.js shapes.
* `ScrambleAnimation.ts` - Handles runic scrambling and character-by-character textual reveal effects.
* `ScreenShake.ts` - Camera shaking feedback for impacts and tremors.
* `TweenUtils.ts` - Standardized ease configurations for cards, sliding books, and UI banners.
* `Vignette.ts` - Adds an atmospheric shadow border enhancing depth in dungeon biomes.

---

### 📂 src/game/scenes (Phaser Game Scenes)

#### 📂 scenes/menu/
* `Boot.ts` - Initial load screen caching raw assets, spritesheets, and font maps.
* `MainMenu.ts` - Title screen featuring neon highlights and option panels.
* `Multiplayer.ts` - Interactive room search browser and matchmaking lobby.
* `Covenant.ts` - Interactive selection altar where players choose their philosophy (Snake, Phoenix, Dragon) and synchronize state.

#### 📂 scenes/world/
* `LevelScene.ts` - Manages the exploration phase, physics world steps, tileset collisions, and interactive objects.
* `TransitionScene.ts` - High-quality transition wipes separating exploration, menus, and battles.

#### 📂 scenes/combat/
* `CombatScene.ts` - Operates the active combat overlay, instantiating enemies, triggering damage animations, and coordinating with `CombatSystem` and systems layers.

#### 📂 scenes/ui/
* `Achievements.ts` / `AchievementsUI.ts` - Grid representing badge accomplishments and metadata.
* `ControlsUI.ts` - Keyboard mappings guide.
* `Help.ts` - Comprehensive page showing mechanical guides, rules, and basic controls.
* `ItemModal.ts` - Detailed tooltip modal for inspected trade items.
* `NotificationOverlay.ts` - UI broker distributing discovery popups.
* `Settings.ts` / `SettingsUI.ts` - General gameplay and audio adjustments.
* `GlossaryUI.ts` - The primary lore book. Spawns a beautiful, dual-page book layout that hosts several page scenes.

#### 📂 scenes/ui/glossary/ (Lore Book Pages)
* `GlossaryProloguePage.ts` - Narrative entry introduction recounting the fracturing of language and reality.
* `GlossaryRunesPage.ts` - Discovered rune lexicon showing translations, card types, and descriptions.
* `GlossaryCombosPage.ts` - Combos journal showing unlocked 3-rune legendary combinations.
* `GlossaryBestiaryPage.ts` - List of defeated monsters, models, stats, and tactical advice.
* `GlossaryItemsPage.ts` - Collectible item inventory and lore logging.
* `GlossaryLocationsPage.ts` - Map outlines tracking discovered biomes, settlements, and portals.
* `GlossaryPlayerPage.ts` - Progress dashboard displaying stats, covenant status, gemstone tallies, and trade summaries.

---

## Complete Folder Tree

```text
src/game/
├── AssetRegistry.ts
├── EventBus.ts
├── NetworkManager.ts
├── constants.ts
├── types.ts
├── main.ts
│
├── combat/
│   ├── CombatSystem.ts
│   ├── CombatHUD.ts
│   └── StatusEffectUI.ts
│
├── data/
│   ├── BestiaryData.ts
│   ├── ItemData.ts
│   ├── LocationData.ts
│   ├── MultiplayerData.ts
│   ├── PlayerData.ts
│   ├── RuneData.ts
│   └── UserData.ts
│
├── systems/
│   ├── BossButtonSystem.ts
│   ├── ChestSystem.ts
│   ├── CollisionParser.ts
│   ├── DoorSystem.ts
│   ├── InteractSystem.ts
│   ├── LightSystem.ts
│   ├── PlayerPanelSystem.ts
│   ├── PortalSystem.ts
│   ├── RunePickerSystem.ts
│   └── TradeSystem.ts
│
├── utils/
│   ├── AchievementNotification.ts
│   ├── Cat.ts
│   ├── GeometryUtils.ts
│   ├── ScrambleAnimation.ts
│   ├── ScreenShake.ts
│   ├── TweenUtils.ts
│   └── Vignette.ts
│
└── scenes/
    ├── combat/
    │   └── CombatScene.ts
    ├── menu/
    │   ├── Boot.ts
    │   ├── Covenant.ts
    │   ├── MainMenu.ts
    │   └── Multiplayer.ts
    ├── world/
    │   ├── LevelScene.ts
    │   └── TransitionScene.ts
    └── ui/
        ├── Achievements.ts
        ├── AchievementsUI.ts
        ├── ControlsUI.ts
        ├── GlossaryUI.ts
        ├── Help.ts
        ├── ItemModal.ts
        ├── NotificationOverlay.ts
        ├── Settings.ts
        ├── SettingsUI.ts
        └── glossary/
            ├── GlossaryBestiaryPage.ts
            ├── GlossaryCombosPage.ts
            ├── GlossaryItemsPage.ts
            ├── GlossaryLocationsPage.ts
            ├── GlossaryPlayerPage.ts
            ├── GlossaryProloguePage.ts
            └── GlossaryRunesPage.ts
```

---

## System Architecture Diagram

```mermaid
graph TD
    A[index.html] --> B[src/main.ts]
    B --> C[src/game/main.ts]
    C --> D[Scenes]
    
    subgraph Scenes [Phaser Scenes]
        direction TB
        subgraph Menu [scenes/menu]
            Boot --> MainMenu
            MainMenu --> Multiplayer
            Multiplayer --> Covenant
        end

        subgraph World [scenes/world]
            Covenant --> TransitionScene
            TransitionScene --> LevelScene
            LevelScene --> TransitionScene
        end
        
        subgraph Combat [scenes/combat]
            LevelScene --> CombatScene
            CombatScene --> TransitionScene
        end

        subgraph UI [scenes/ui]
            GlossaryUI
            AchievementsUI
            Help
            SettingsUI
            NotificationOverlay
        end
        
        subgraph GlossaryPages [scenes/ui/glossary Pages]
            GlossaryUI --> GlossaryProloguePage
            GlossaryUI --> GlossaryRunesPage
            GlossaryUI --> GlossaryCombosPage
            GlossaryUI --> GlossaryBestiaryPage
            GlossaryUI --> GlossaryItemsPage
            GlossaryUI --> GlossaryLocationsPage
            GlossaryUI --> GlossaryPlayerPage
        end
    end

    subgraph Systems [Reusable Systems]
        CollisionParser
        DoorSystem
        RunePickerSystem
        PlayerPanelSystem
        BossButtonSystem
        ChestSystem
        InteractSystem
        LightSystem
        PortalSystem
        TradeSystem
    end

    subgraph Data [State Managers]
        PlayerData
        MultiplayerData
        RuneData
        BestiaryData
        ItemData
        LocationData
        UserData
    end
    
    subgraph Network [Networking Layer]
        NM[NetworkManager] <-->|WebRTC| Peers[Other Players]
        NM <-->|HTTP| LobbyServer[lobby-server.js]
    end

    subgraph Core [Core Modules]
        EventBus
        AssetRegistry
        Types[types.ts]
    end

    LevelScene --> CollisionParser
    LevelScene --> DoorSystem
    LevelScene --> ChestSystem
    LevelScene --> InteractSystem
    LevelScene --> LightSystem
    LevelScene --> PortalSystem
    LevelScene --> BossButtonSystem
    LevelScene --> TradeSystem
    
    CombatScene --> RunePickerSystem
    CombatScene --> PlayerPanelSystem
    CombatScene --> TradeSystem
    
    Multiplayer -->|Matchmaking| NM
    Covenant -->|P2P Sync| NM
    
    Scenes --> Data
    Scenes --> Core
```
