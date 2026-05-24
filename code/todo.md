# Raidho Rune Hub System

- Add a centralized Raidho rune in the middle hub mount position, offset 3px upward.
- Rune starts with color `#99988c`, font size `40px`, using the provided rune font.
- Rune meaning: travel/teleportation.
- Rune becomes interactable only after all 3 combats are completed.
- Interaction type is hold-to-interact.

# Rune Progression

- Each completed combat shifts the rune color closer to `#586a44`.
- Never darken the rune.
- After the first combat, enable a smooth looping pulse/glint animation on the rune.
- Pulse effect should softly lighten the rune color over time.

# Teleport Sequence

- After successful hold interaction:
  - Trigger a screen-whitening teleport animation.
  - Move the player to the next floor.
  - Preserve all player states except combat count.
  - Combat count resets to require 3 combats again for the next floor.

# Floor Progression

- Repeat system until all 3 floors are completed.
- Trades persist between floors and are never reset.
- Boss room door closes again on each new floor.
- Settlement changes on each new floor.

# Notes

- Do not inspect or modify maps or tilesets.
- Only implement the code logic and behaviors described above.