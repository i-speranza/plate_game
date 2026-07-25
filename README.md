# Plate Word Game

A real-time multiplayer word game for mobile browsers. Players submit words containing letters from a licence-plate-style set of 4 letters; scoring rewards letter coverage and speed.

## Prerequisites

- **Node.js 20+**
- npm (comes with Node)

## Quick start

```bash
# Install dependencies
npm install

# Build shared package and word dictionaries (first run)
npm run build -w shared
npm run build:dicts

# Start server (port 3001) + client (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Mobile testing on LAN

Find your machine's local IP and open `http://<your-ip>:5173` on your phone (same Wi‑Fi network). The Vite dev server proxies WebSocket traffic to the backend.

## How to play

1. **Create Game** — enter a nickname; share the 6-character passcode or link.
2. **Join Game** — enter passcode (or open a shared `?code=XXXXXX` link).
3. Host configures rounds, duration, and language in the lobby, then **Start Game**.
4. Each round: host picks random or manual plate letters → 3s countdown → type words → round summary.
5. After the final round, view results; host can **Play Again** (same passcode, scores reset).

## Project structure

| Package | Description |
|---|---|
| `shared/` | Types, scoring, letter matching (used by client + server) |
| `server/` | Fastify + Socket.io game server, dictionaries |
| `client/` | React + Vite mobile-first UI |

## Dictionaries

Built via `npm run build:dicts`:

- **Italian:** [Morph-it](https://github.com/angelocolosso/morph-it) lemma list
- **English:** [dwyl/english-words](https://github.com/dwyl/english-words) (`words_alpha.txt`)

If download fails, a small fallback word list is used for local development.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run client + server concurrently |
| `npm run build` | Build all packages |
| `npm run build:dicts` | Download/build dictionary JSON files |
| `npm run test` | Run shared package unit tests |

## Scoring

Scores interpolate linearly from max (at round start) to min (at round end) based on submission time. Tiers: ordered 4-letter subsequence (1500–1200), any 4 letters (1000–800), 3 letters (800–600), 2 letters (600–400), 1 letter (0).

See [plate_game_requirements.md](plate_game_requirements.md) for full product spec.
