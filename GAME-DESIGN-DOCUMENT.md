# **G.L.O.S.S.A.R.Y**

### *Game Design Document (GDD)*

**Genre:** Roguelike Deckbuilder / Symbolic Turn-Based RPG
**Structure:** 7-Floor Run-Based Tower Climber
**Primary Inspiration:** Tunic

---

# 1. High Concept

**G.L.O.S.S.A.R.Y** is a symbolic roguelike set in a mythic interpretation of Mesopotamian Babel.

You play as **The Shadow**, an undefined being climbing the seven levels of Babel in pursuit of godhood. The higher you ascend, the less reality obeys physics and the more it obeys **concepts**.
Your only constant is your **Glossary**.

The Glossary records:

* Identified symbols
* Learned runes
* Relics
* Echoes (memory currency)
* Concept bindings

If you lose your Glossary, you lose your identity.

---

# 2. Setting

## Babel – Mesopotamia (90% of the Game)

Inspired by:

* Mesopotamia
* Tower of Babel

Babel is divided into **7 Floors**, each representing a breakdown of reality.

| Floors | State of Reality | Gameplay Effect              |
| ------ | ---------------- | ---------------------------- |
| 1–2    | Mundane Reality  | Symbols are decorative       |
| 3–4    | Cultural Bleed   | Symbols gain passive effects |
| 5–6    | Symbol Collapse  | Gods contradict each other   |
| 7      | Inhuman Apex     | Enemies are pure concepts    |

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

* Run (Floors 1–3 only)
* Use Active Items
* Sacrifice Items for Tributes

---

# 4. Player Character

## The Shadow

* No defined identity.
* Seeks covenant to become "someone."
* Has no base class — Covenant defines playstyle.
* Progression tied to Glossary, not XP.

---

# 5. Combat System – “Living Language”

Turn-Based Symbol Construction System.

Each turn you receive random **Runes**.

Example Runes:

```
ᚠ = Energy
ᚱ = Motion
ᚲ = Destruction
ᛞ = Defense
```

You build Chains:

* ᚠ + ᚲ → Fire Blast
* ᚱ + ᚲ → Dash Attack
* ᛞ + ᚠ → Barrier Recharge

### Rules:

* Longer Chains = stronger effects
* Some combinations unlock hidden words
* Identified symbols enhance rune efficiency
* Chain memory stored in Glossary

---

# 6. Special Status Effects

| Status     | Effect                                          |
| ---------- | ----------------------------------------------- |
| Scorched   | Turn damage, reduced resistance & healing       |
| Suppressed | Cannot use special intents, chance to lose turn |
| Fated      | Repeats previous intent next turn               |

---

# 7. Currencies

| Currency | Gained By          | Purpose            |
| -------- | ------------------ | ------------------ |
| Money    | Killing enemies    | Buy items          |
| Echoes   | Analyzing symbols  | Rewind / recursion |
| Ashes    | Taking damage      | Phoenix mechanics  |
| Tributes | Sacrificing relics | Covenant abilities |

---

# 8. Covenants

A Covenant defines your philosophy of ascension.

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

1. Seraph’s Plume
2. Echojar of the Damned
3. Reversed Scale
4. 404: Location Not Found
5. Schizostone
6. Runefall
7. VoidFrame
8. Broken Crown
9. Namaste?
10. The Archive
11. Fog of War
12. Second Amendment

Each item has:

* Powerful effect
* Severe drawback
* Combo potential

Example Combo:
Reversed Scale + Broken Crown → Self-buff inversion meta.

---

# 10. Boss Structure

Floor 7 triggers one of 7 Conceptual Bosses.

Boss archetypes represent:

* Authority
* Memory
* Sacrifice
* Language
* Dominion
* Recursion
* Oblivion

Final boss altered by chosen Covenant.

If defeated:
→ Ascend to Godhood

If defeated by boss:
→ Thrown to corpse pile (run ends)

---

# 11. Glossary System (Meta-Progression)

The Glossary:

* Records identified symbols
* Stores Echoes
* Unlocks passive world effects
* Expands rune pool
* Unlocks hidden words

Never lose your Glossary.

It ties **concepts to you**.

---

# 12. Multiplayer – Battle of Seeds

Inspired structurally by asynchronous roguelike competition.

* Players share same Seed
* Identical symbol layout
* Compete for:

  * Fastest ascension
  * Highest concept control
  * Most efficient Echo usage

Leaderboards:

* Fewest turns
* Most symbols identified
* Highest survival margin

---

# 13. Difficulty Curve

| Stage | Challenge Type      |
| ----- | ------------------- |
| Early | Tactical combat     |
| Mid   | Concept stacking    |
| Late  | Reality instability |
| Final | Identity challenge  |

The game transitions from:
Dungeon Crawler → Mythic System → Philosophical Combat

---

# 14. Visual Identity

* Ancient Mesopotamian stone textures
* Living runes glowing
* UI feels like carved tablet
* Symbols animate when identified
* Final floor: language visually breaks apart

Minimalist storytelling.
No direct exposition.

Player learns through:

* Symbol behavior
* Glossary fragments
* Environmental contradiction

---

# 15. Pillars of Design

1. Knowledge is Power
2. Memory is Currency
3. Identity is Constructed
4. Death is Utility
5. Language is Weapon

---

# 16. Endgame Philosophy

You begin as Shadow.

You choose a Covenant.

You climb Babel.

At Floor 7, the question is not:

“Can you win?”

But:

“Are you worthy of defining meaning?”

---

If you’d like, next I can:

* Design the 7 specific Bosses in detail
* Balance the rune-combination combat mathematically
* Create a full sample run
* Or structure this into a pitch-ready publisher document
