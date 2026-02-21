# **G.L.O.S.S.A.R.Y**

### *Game Design Document (GDD)*

**Genre:** Roguelike Deckbuilder / Symbolic Turn-Based RPG
**Structure:** 7-Floor Run-Based Tower Climber
**Primary Inspiration:** Tunic & Slay-The-Spire

---

# 1. High Concept

**G.L.O.S.S.A.R.Y** is a symbolic roguelike set in a mythic interpretation of Mesopotamian "Tower of Babel". You play as **The Shadow**, an undefined being climbing the seven levels of Babel in pursuit of godhood. The higher you ascend, the less reality obeys physics, thus your only constant are the records in your **Glossary**.

The Glossary records:
* Symbols
* Runes
* Relics (Items)
* Beasts
* Bosses
* Regions
  
---

# 2. Setting

## Babel – Mesopotamia

Babel is divided into **7 Floors**, the higher the more distorted.

| Floors | State of Reality  | Gameplay Effect                      |
| ------ | ----------------- | -------------------------------------|
| 1–2    | Mundane Reality   | Everything works as intended         |
| 3–4    | Cultural Bleed    | Unidentified records = ~10% Failing  |
| 5–6    | Symbolic Collapse | Unidentified records = ~30% Failing  |
| 7      | Inhuman Horizon   | Unidentified records = ~100% Failing |

---

# 3. Core Gameplay Loop

1. Choose Covenant
2. Enter Floor
3. Explore & Identify Symbols
4. Trigger Fight (Turn-Based Combat)
5. Win ≥ 1 Fight to Progress
6. Ascend
7. Floor 7 → Final Boss
8. Ascend to Godhood or Fall to the Corpse Pile

Optional:
* Buy Items

---

# 4. Player Character

## The Shadow

* No defined identity. (No Base Class)
* Seeks covenant to become "someone."
* Progression is tied to its glossary - Death = Restart glossary.

---

# 5. Combat System – “Living Language”

- Turn-Based Symbol Construction System.
- Each turn you receive/draw random **Runes** - up to 7 in hand.

Example Runes:

```
ᚠ = Energy
ᚱ = Motion
ᚲ = Destruction
ᛞ = Defense
```

You build Chains:

* ᚠ + ᚲ → Fire Blast
* ᚱ + ᚲ → Dash
* ᛞ + ᚠ → Forcefield

### Rules:

* Longer Chains = stronger effects
* Unidentified runes/chains are weaker
* Identified runes enhance rune efficiency
* Chain memory is stored in Glossary

---

# 6. Special Status Effects

| Status     | Effect                                          |
| ---------- | ----------------------------------------------- |
| Scorched   | Turn damage, reduced resistance & healing       |
| Suppressed | Cannot use special intents, chance to lose turn |
| Fated      | Repeats previous intent next turn               |

---

# 7. Currencies

| Currency  | Gained By           | Purpose            |
| --------- | ------------------- | ------------------ |
| Gemstones | Killing enemies     | Buy/Use items      |
| Echoes    | Analyzing symbols   | Snake mechanics    |
| Ashes     | Taking damage       | Phoenix mechanics  |
| Tributes  | Sacrificing records | Covenant mechanics |

---

# 8. Covenants

A Covenant defines your ascension.

---

## 🜂 Covenant of the Coil (Ouroboros)

Theme: Recursion, inevitability, memory.

### Core Mechanic: Reversal

* Once per floor → Rewind a combat turn
* Once per run → Redo cleared floor (mutation penalty)
* Cards repeat last action
* On-death triggers activate twice

### Resource:

Echoes = fuel for rewinds

### Playstyle:

High-skill, memory-based, optimization heavy.

---

## 🜁 Covenant of the Crown (Dragon)

Theme: Authority, hierarchy, dominance.

### Core Mechanic: Control

* Suppress enemies
* Threat meter (damage dealt without being hit)
* Break morale → Elites kneel

### Symbol Synergy:

* Nordic / Roman → dominance boosts
* Religious → obedience mechanics

### Playstyle:

Stable, control-oriented, calculated.

---

## 🜄 Covenant of the Ash (Phoenix)

Theme: Suffering → Transcendence.

### Core Mechanic: Death as Resource

* Revive with penalty
* Burn cards for power
* Gain Ash when damaged

### Religious Synergy:

* Egyptian → afterlife buffs
* Christian → sacrifice triggers

### Playstyle:

High risk, snowball potential.

---

# 9. Item System (Multiplayer Compatible)

* 3 Active Items
* Combinable
* Trade-offs
* Unique Mechanics

## 12 Core Items

1. **Seraph's Plume (Feather)**
<details>
<summary>Effect Details</summary>
- Revives the user once per battle at 30% HP and grants 1 turn of invulnerability.  
- After revival, user suffers –25% damage output for the rest of the fight.
</details>

2. **Echojar of The Damned (Bottle)**
<details>
<summary>Effect Details</summary>
- Replays the first attack chain performed in the battle (same targets + effects).  
- Replayed attacks deal –40% damage.
</details>

3. **Reversed Scale (Dragon Scale)**
<details>
<summary>Effect Details</summary>
- Inverts all status effects (buffs <-> debuffs).  
- Inverts order of draw.
</details>

4. **404: Location Not Found (Map)**
<details>
<summary>Effect Details</summary>
- Makes all effects have a 100% sure hit.  
- 25% chance to disable an item for next round (other than this one).
</details>

5. **Schizostone (Rock)**
<details>
<summary>Effect Details</summary>
- 50% chance to deal double damage.  
- 50% chance to receive double damage.
</details>

6. **Runefall (Thor’s Hammer)**
<details>
<summary>Effect Details</summary>
- Calls lightning that deals heavy AoE damage and stuns enemies for 1 turn.  
- User becomes exhausted and skips their next turn.
</details>

7. **VoidFrame (Photo)**
<details>
<summary>Effect Details</summary>
- Captures an enemy, removing them from battle for 1 turn.  
- Released enemy gains +20% attack for 2 turns.
</details>

8. **Broken Crown (Crown)**
<details>
<summary>Effect Details</summary>
- Grants +30% damage and forces enemies to prioritize the user.  
- User receives +25% incoming damage.
</details>

9. **Namaste? (Prayer Beads / Malas)**
<details>
<summary>Effect Details</summary>
- Fully cleanses debuffs and heals 35% HP.  
- User cannot attack next turn.
</details>

10. **The Archive (Deck of Cards)**
<details>
<summary>Effect Details</summary>
- Draws a random stored effect from previous chains (attacks).  
- Effect is halved.
</details>

11. **Fog of War (Skull Smoke)**
<details>
<summary>Effect Details</summary>
- Makes enemies attack each other for 1 turn.  
- User becomes confused this turn too.
</details>

12. **Second Amendment (Gun with Flag)**
<details>
<summary>Effect Details</summary>
- Deals enormous damage and Marks an enemy (takes double damage).  
- Costs 25% of total gemstones per use (minimum 20).
</details>


Each item has:

* Powerful effect
* Severe drawback
* Combo potential

Example Combo:
Reversed Scale + Broken Crown → Self-buff inversion meta.

---

# 10. Boss Structure

Floor 7 triggers one of 7 Conceptual Bosses. This will be choosen by found symbols by user (Yin-Yang | Dharma Wheel | etc...), if no religion symbols are found - Hidden boss is triggered.

If defeated:
→ Ascend to Godhood
If defeated by boss:
→ Thrown to corpse pile (run ends)

---

# 11. Glossary System (Meta-Progression)

The Glossary:
* Symbols
* Runes
* Relics (Items)
* Beasts
* Bosses
* Regions
* Game Configuration
---

# 12. Multiplayer – Battle of Seeds

Inspired structurally by asynchronous roguelike competition.

* Players share same Seed
* Identical symbol layout
* Compete for:
  * Fastest ascension (3 Lives)
* First Player to reach a boss enables timer for player 2 (3 minutes)
  * Player 2 Fails to reach boss (-1 live)
  * Player 2 Succeeds to reach boss (Battle for boss goes) 

---

# 13. Difficulty Curve

| Stage       | Challenge Type                                        |
| ----------- | ----------------------------------------------------- |
| Early (1-2) | Simple Combat                                         |
| Mid   (3-4) | Start of Chains                                       |
| Late  (5-6) | Structuring Full Build                                |
| Final (7)   | Full build - Clean up of unidentified builds/records  |

---

# 14. Visual Identity

* Ancient Mesopotamian stone textures
* Living runes glowing
* UI feels like carved tablet
* Symbols animate when identified
* Symbols have glint/Other identifiable animations
* The higher the floor the more glichy the UI/Game becomes

Minimalist storytelling. (No dialogue)  
Player learns through:
* Repetition

---

# 15. Pillars of Design

1. Knowledge is Power
2. All Knowledge is Stored in Glossary
3. The More you Identify the More Possibilities 

---

# 16. Philosophy

1. You begin as Shadow.
2. You choose a Covenant.
3. You climb Babel.
4. At Floor 7, the question is “Are you worthy of defining yourself?”
