# G.L.O.S.S.A.R.Y.

A cooperative 1–3 player exploration turn-based RPG.

**The Shadows** — nameless consciousnesses stripped of their identities — awaken in a fractured Central Hub. To reclaim their lost meaning, players must journey through three decaying realms, master ancient runes, conquer realm guardians, and unite at the Summit to face a mythical god in a final, conjoined battle.

---

## Project Structure

```
G.L.O.S.S.A.R.Y/
├── Audio/       Music and sound effect source files
├── code/        Game source, assets, and build tooling
└── docs/        Design documentation
```

For the full architecture and folder breakdown, see [`docs/ARCH.md`](docs/ARCH.md).

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/GGD.md`](docs/GGD.md) | Game Design Document |
| [`docs/ARCH.md`](docs/ARCH.md) | Architecture & folder structure |
| [`docs/MULTIPLAYER.md`](docs/MULTIPLAYER.md) | Multiplayer protocol |
| [`docs/SYNOPSIS.md`](docs/SYNOPSIS.md) | Narrative synopsis |

## Running

```bash
cd code
npm install
npm run dev
```

For multiplayer lobby discovery:

```bash
node lobby-server.js
```

---

## Author

**Jesse Ricardo Rogerio** — Design, development, pixel art, and audio.
