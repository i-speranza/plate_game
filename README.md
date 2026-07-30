# Plate Word Game

A real-time multiplayer word game for mobile browsers. Players submit words containing letters from a licence-plate-style set (3–6 letters per round); scoring rewards letter coverage and speed.

## Prerequisites

- **Node.js 20+**
- npm (comes with Node)

## Quick start

```bash
# Install dependencies
npm install

# Build shared package (first run)
npm run build -w shared

# Start server (port 3001) + client (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Mobile testing on LAN

Find your machine's local IP and open `http://<your-ip>:5173` on your phone (same Wi‑Fi network). The Vite dev server proxies WebSocket traffic to the backend.

## How to play

1. **Create Game** — enter a nickname; share the 6-character passcode or link.
2. **Join Game** — enter passcode (or open a shared `?code=XXXXXX` link).
3. Host configures rounds, duration, language, and letter count (3–6) in the lobby, then **Start Game**.
4. Each round: host picks random or manual plate letters → 3s countdown → type words → round summary.
5. After the final round, view results; host can **Play Again** (same passcode, scores reset).



## Project structure


| Package   | Description                                               |
| --------- | --------------------------------------------------------- |
| `shared/` | Types, scoring, letter matching (used by client + server) |
| `server/` | Fastify + Socket.io game server, dictionaries             |
| `client/` | React + Vite mobile-first UI                              |




## Dictionaries

Italian and English word lists are committed under `server/dictionary/` and copied into the server build automatically.


| Language    | Source                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| **Italian** | [lemmi_italiani](https://github.com/i-speranza/lemmi_italiani)                  |
| **English** | [dwyl/english-words](https://github.com/dwyl/english-words) (`words_alpha.txt`) |


## Scripts


| Command               | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Run client + server concurrently                            |
| `npm run build`       | Build all packages                                          |
| `npm run build:prod`  | Build for production                                        |
| `npm start`           | Run production server (serves API + client)                 |
| `npm run test`        | Run shared package unit tests                               |




## Deploy (Render)

Production runs as a **single web service**: the Node server serves the built React client and Socket.io on the same origin.

### Local production smoke test

```bash
npm install
npm run build:prod
npm start
```

Open [http://localhost:3001](http://localhost:3001) (or the port set in `PORT`).

### Render setup

1. Push `main` to GitHub.
2. [Render](https://render.com) → **New Web Service** → connect this repo.
3. Use settings from `[render.yaml](render.yaml)` (or set manually):
  - **Build:** `npm install && npm run build:prod`
  - **Start:** `npm start`
  - **Health check:** `/health`
  - **Instance:** Free
4. Deploy and test from two devices (create + join a session).

Optional env vars (see `[.env.example](.env.example)`):

- `PORT` — set automatically by Render
- `NODE_OPTIONS=--max-old-space-size=460` — optional heap cap on 512 MB free tier



### Free tier caveats

- **Cold start:** after ~15 minutes idle, the next visit may take 30–60 seconds to wake up.
- **In-memory sessions:** server restarts or deploys clear active games (no database yet).

Scores interpolate linearly from max (at round start) to min (at round end) based on submission time. Higher tiers require more matching plate letters; an ordered match (all letters as a left-to-right subsequence) scores above the same letters in any order. Ranges scale with the host's letter count (3–6).

See [plate_game_requirements.md](plate_game_requirements.md) for full product spec.