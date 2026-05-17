# G.L.O.S.S.A.R.Y Code Guidelines

Follow these core principles when writing or refactoring code for this project.

## 1. Zero Comments
- **NO COMMENTS IN THE CODE.** Do not explain what the code does using `//` or `/* */`. Write clean, self-explanatory code instead.

## 2. Centralized Constants
- **Always use `constants.ts`**.
- Do not hardcode fonts, colors, or input keys. Use exported constants like `FONT_FAMILY`, `RUNE_FONT`, `TITLE_FONT`, and `InputKeys`.

## 3. Modular Architecture
- **Keep Scenes Thin**: High-level scenes (`CombatScene`, `LevelScene`, `GlossaryUI`) should only act as orchestrators.
- **Extract Logic**: Delegate UI rendering and complex state loops to dedicated sub-components (e.g., `CombatHUD`, `PortalSystem`, `GlossaryRunesPage`).

## 4. Strict Typing & Data
- **Avoid `any`**: Ensure all properties and function parameters have proper TypeScript definitions.
- **Use Singletons for State**: Retrieve persistent game state via data singletons like `PlayerData.getInstance()`, `RuneData.getInstance()`, etc.

## 5. Phaser 3 Specifics
- **Tinting**: This project uses Phaser 3. Do not use Phaser 4's `setTintFill(color)`. Instead, use `.setTint(color).setTintMode(Phaser.TintModes.FILL)`.
- **Tweens and Animations**: Always ensure tweens and timers are tracked in arrays and cleaned up when destroying components or changing scenes to prevent memory leaks.

## 6. Console Logging
- **No unnecessary logs**: Remove all `console.log()` statements unless they are specifically catching and reporting actual `console.error()`.
