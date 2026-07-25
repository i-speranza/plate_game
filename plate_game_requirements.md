# Product Requirements Document
## Plate Word Game

**Version:** 1.0  
**Status:** Draft for Implementation  

---

## 1. Overview

A real-time multiplayer word game inspired by a car journey pastime. Players are shown a set of letters (drawn from a vehicle licence plate) and must submit words containing as many of those letters as possible. Scoring rewards both letter coverage and response speed. The game is mobile-first and accessible from web browsers, with no accounts or registration required.

---

## 2. Core Concepts

| Term | Definition |
|---|---|
| **Host** | The player who creates the game session. Also participates as a regular player. |
| **Player** | Any participant in a session, including the host. |
| **Session** | A single multiplayer game instance identified by a passcode. |
| **Round** | One turn within a session, featuring a unique set of 4 plate letters. |
| **Plate Letters** | The 4 randomly generated letters that define a round. |
| **Valid Word** | A word found in the selected language dictionary that is not a proper noun and is in its base (uninflected) form. |

---

## 3. User Flows

### 3.1 Session Creation (Host)

1. Host opens the app and enters a nickname.
2. Host taps **"Create Game"**.
3. The system generates a unique 6-character alphanumeric **passcode**.
4. A lobby screen is shown displaying:
   - The passcode (prominently, for sharing).
   - A shareable link encoding the passcode.
   - A live list of players who have joined.
5. The host configures the match settings (see §5) before starting.
6. When satisfied with the player list, the host taps **"Start Game"**.

### 3.2 Joining a Session (Players)

1. Player opens the app and enters a nickname.
2. Player taps **"Join Game"** and enters the passcode (or opens the shared link).
3. Player is taken to the lobby, where they see the player list and wait for the host to start.

### 3.3 Reconnection

- If a player disconnects mid-session, they can re-enter via the original passcode and their nickname.
- On reconnect, the player is dropped back into the current state of the game.
- Any rounds that fully elapsed during their absence are scored as 0 for that player; no retroactive scoring.
- If the game has ended, the player sees the final results screen.

---

## 4. Lobby

- Displays all connected players in join order.
- Shows the host with a distinguishing label (e.g. a crown icon).
- Updates in real time as players join or drop.
- Only the host sees the **"Start Game"** button.
- Players see a **"Waiting for host…"** indicator.
- The host may start with any number of players (minimum: 1, i.e. solo play is allowed).

---

## 5. Match Settings (Configured by Host Before Start)

| Setting | Options / Constraints | Default |
|---|---|---|
| **Number of rounds** | Integer, 1–20 | 5 |
| **Round duration** | 30s / 60s / 90s / 120s / custom (10–300s) | 60s |
| **Language** | Selectable from supported languages (see §6) | Italian |

Settings are locked once the host taps "Start Game" and cannot be changed mid-session.

---

## 6. Language & Dictionary

### 6.1 Supported Languages (v1.0)
- Italian (default)
- English
- *(Additional languages to be added in future versions)*

### 6.2 Dictionary Requirements
- Each language has a bundled dictionary of valid base-form words.
- **Valid entries:** root/lemma forms only. Inflected forms (conjugated verbs, plurals, gendered adjectives, diminutives) are **not valid**.
- **Invalid entries:** proper nouns (names of people, places, brands) are **not valid**.
- Dictionary lookup is case-insensitive and accent-insensitive within a language.
- The alphabet used for random letter generation is the standard alphabet of the selected language (e.g. Italian alphabet: 21 letters, excluding J, K, W, X, Y unless borrowed words require them — confirm with dictionary source).

### 6.3 Letter Generation
At the start of each round, before the timer begins, the host chooses one of two modes:

**Random mode**
- 4 letters are drawn uniformly at random from the selected language's alphabet.
- Letters are drawn **with replacement** (the same letter can appear more than once).

**Manual mode**
- The host is presented with a 4-letter input field.
- The host types exactly 4 letters (validated to be letters only, no digits or symbols).
- The entered letters are locked in and sent to all players when the host confirms.

In both modes, letters are displayed to all players simultaneously at round start, in the order they were generated or entered.

---

## 7. Round Lifecycle

```
Host starts match
       │
       ▼
  Countdown (3s)
       │
       ▼
  Round starts — timer begins, plate letters shown
       │
       ├── Players submit words at any time
       │
       ├── [Early end condition] All players have tapped "Give Up"
       │
       ▼
  Round ends (timer expires OR all gave up)
       │
       ▼
  Round Summary Screen (scores + best words revealed)
       │
       ▼
  Host taps "Next Round" → next round begins
  (or "End Game" if final round)
       │
       ▼
  Final Results Screen
```

### 7.1 During a Round
- The 4 plate letters are displayed prominently to all players.
- A countdown timer counts down from the configured duration.
- Each player has a text input and a **"Submit"** button.
- A **"Give Up"** button is available. Tapping it locks out that player from further submissions for this round.
- Submissions are validated on submission (not real-time); feedback (valid / invalid) is shown immediately to the submitting player only.
- Other players' submissions are **hidden** until the round ends.
- A player's own previous submissions in the current round are not tracked or displayed (duplicates are allowed and are the player's own responsibility).

### 7.2 Round End Conditions
- The round timer reaches 0, **OR**
- Every connected player has tapped "Give Up".

### 7.3 Post-Round Summary
- All players' valid submissions are revealed, alongside the score earned for each word.
- The round leaderboard (round scores) is displayed.
- The cumulative leaderboard (total scores across all rounds so far) is displayed.
- Only the host sees a **"Next Round"** button. All other players see "Waiting for host…".

---

## 8. Word Validation Rules

A submitted word is **valid** if and only if all of the following are true:

1. The word exists in the active language dictionary.
2. The word is in its **uninflected base form** (infinitive for verbs; singular masculine for Italian adjectives; singular for nouns).
3. The word is **not a proper noun**.
4. The word contains **at least 1** of the 4 plate letters.

**Invalid submissions** are rejected with a short inline message (e.g. "Not in dictionary", "Must be base form"). The rejection is shown only to the submitting player.

> **Note on dictionary tooling:** The distinction between valid base forms, inflections, and proper nouns must be enforced by the dictionary data itself (e.g. a tagged lemma list or a curated word list). This is a key data dependency for v1.0.

---

## 9. Scoring System

### 9.1 Letter Matching Logic

- Count how many of the 4 **distinct** plate letters appear anywhere in the submitted word (case-insensitive).
- **Occurrences do not matter.** Each plate letter counts at most once, regardless of how many times it appears in the word.

**Example:**  
Plate letters: `C R A D`  
- `CARD` → matches C, A, R, D = **4 letters**  
- `ACCORDIO` → matches C, A, R, D = **4 letters** (C appears twice in word, still counts as 1)  
- `CARO` → matches C, A, R = **3 letters**  

### 9.2 Score Bands

Scores are linear interpolations based on submission time within the round.

- Let `t_ms` = elapsed time at submission in **milliseconds**.
- Let `T_ms` = total round duration in milliseconds.
- Interpolation factor: **`f = t_ms / T_ms`** (0.0 at round start, 1.0 at round end).
- Using millisecond precision minimises tie-breaks between near-simultaneous submissions.

| Tier | Condition | Max Score (`f=0`) | Min Score (`f=1`) | Formula |
|---|---|---|---|---|
| **Ordered match** | All 4 plate letters appear in the word **in the exact order displayed** | 1500 | 1200 | `1500 − 300 × f` |
| **4-letter match** | All 4 plate letters appear in the word (any order) | 1000 | 800 | `1000 − 200 × f` |
| **3-letter match** | Exactly 3 plate letters appear in the word | 800 | 600 | `800 − 200 × f` |
| **2-letter match** | Exactly 2 plate letters appear in the word | 600 | 400 | `600 − 200 × f` |
| **1-letter match** | Only 1 plate letter appears in the word | **0** | **0** | No points awarded |

**Ordered match clarification:** the 4 plate letters must appear as a subsequence of the word in the same left-to-right order as displayed, but not necessarily consecutively. Example: plate `C R A D`, word `CURVARD` → C…R…A…D appear in order → ordered match. Word `DRACENA` → D comes before R, not after → not an ordered match, falls to 4-letter match tier.

- Scores are rounded to the nearest integer.
- **Only the highest-scoring valid submission per player per round counts** toward their round total.
- If two submissions land in the same tier, the one with the lower `t_ms` wins.

> **Design note:** All score bands, range widths, and the formula are defined in a single configuration object so they can be tuned without code changes.

### 9.3 Match Winner

- The player with the highest cumulative score across all rounds wins.
- In case of a tie, tied players share the win.

---

## 10. Real-Time Infrastructure

- The app requires a persistent real-time connection (WebSocket or equivalent) between all players in a session.
- Events that must be synchronized in real time:
  - Player joins / leaves lobby
  - Host starts game
  - Round starts (plate letters + timer start)
  - Player gives up
  - Round ends
  - Round summary data published to all players
  - Host advances to next round
  - Session ends / final results

---

## 11. Screens & UI Summary

| Screen | Visible To | Key Elements |
|---|---|---|
| Home | All | Nickname input, Create Game, Join Game |
| Lobby | All | Passcode display, player list, settings (host only), Start button (host only) |
| Round Active | All | Plate letters, countdown timer, word input + Submit, Give Up button, own submission feedback |
| Round Summary | All | All valid submissions per player, round scores, cumulative leaderboard, Next Round (host only) |
| Final Results | All | Full leaderboard, winner highlight, Play Again (host) / Leave buttons |
| Reconnect | Returning player | Passcode + nickname entry, rejoin button |

---

## 12. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Platform** | Mobile-first responsive web app; must be fully playable on iOS Safari and Android Chrome; desktop browsers supported. |
| **Latency** | Round start and round end events must propagate to all clients within 500ms under normal network conditions. |
| **Session persistence** | Sessions remain active for at least 2 hours of inactivity; players can reconnect within this window. |
| **Passcode uniqueness** | Passcodes must be unique among active sessions. |
| **Nickname uniqueness** | Within a session, duplicate nicknames should be rejected or auto-suffixed (e.g. "Marco2"). |
| **Dictionary size** | Must support dictionaries of 100k+ entries without perceptible lookup latency (<50ms per lookup). |
| **No accounts** | No authentication, no persistent user data, no cookies beyond session state. |

---

## 13. Out of Scope (v1.0)

- Plate letters sourced from real car plate photos (camera input).
- Spectator mode (non-playing observers).
- In-app chat or reactions.
- Historical stats or match history.
- Monetisation / ads.
- Offline play.
- Custom dictionaries uploaded by users.

---

## 13. Play Again Flow

- After the final results screen, the host can tap **"Play Again"**.
- The same session passcode and player list are reused; no one needs to re-enter a code.
- Match settings (rounds, duration, language) can be reconfigured by the host in the lobby before starting the new match.
- All scores from the previous match are reset.
- Players who had left or disconnected are not automatically re-added; they must rejoin via the passcode.

---

## 14. Design

### 14.1 Visual Identity

The game lives on a phone in a moving car — glanceable, high-contrast, and energetic. The aesthetic draws from vintage European road signage and physical letter tiles: bold, utilitarian letterforms against a dark asphalt-toned background, with a single vivid accent colour that pulses to signal urgency.

**Colour palette**

| Role | Name | Hex |
|---|---|---|
| Background | Asphalt | `#1A1A2E` |
| Surface (cards, panels) | Dark Slate | `#16213E` |
| Border / divider | Steel | `#2A2A4A` |
| Primary accent | Signal Yellow | `#F5C518` |
| Success / valid | Go Green | `#4CAF50` |
| Error / invalid | Stop Red | `#E53935` |
| Body text | Off-White | `#E8E8F0` |
| Muted text | Fog | `#8888AA` |

**Typography**

- **Display / plate letters:** `Space Grotesk` (Bold, 700) — wide, geometric, unmistakably mechanical. Used for the 4 plate letters and player scores.
- **Body / UI:** `Inter` — neutral, highly legible at small sizes on mobile.
- Both fonts are available via Google Fonts.

### 14.2 Signature Element: The Plate

The 4 letters of each round are displayed as a **stylised licence plate tile** — a rounded rectangle with a subtle embossed border, the letters spaced wide in `Space Grotesk Bold`, rendered in Signal Yellow on a near-black background. This is the focal point of every round screen. It should feel physical and tactile, not like a generic text label.

### 14.3 Key Screen Treatments

**Lobby**
- Dark background, passcode displayed in large `Space Grotesk` inside a plate-style tile so it's easy to read out loud.
- Player list as simple rows with a subtle fade-in animation as each player joins.

**Round Active**
- The plate tile dominates the top third of the screen.
- A thin progress bar (Signal Yellow) runs along the top edge of the screen, depleting in real time.
- When under 10 seconds remain, the progress bar pulses red and the timer turns Stop Red.
- The word input field is large, centred, with a prominent "Submit" button in Signal Yellow.
- "Give Up" is a small muted text link, not a button — discourages accidental taps.

**Submission feedback**
- Valid word: brief green flash + checkmark beneath the input, word text resets to empty.
- Invalid word: brief red flash + one-line reason ("Not in dictionary", "Use base form", etc.), word text stays for correction.

**Round Summary**
- Results revealed with a fast staggered animation (cards drop in by score, highest first).
- The winning word of the round is highlighted with the plate tile shown again above it.
- Leaderboard rows use a subtle rank-change indicator (↑ ↓) versus the previous round.

**Final Results**
- Winner's name rendered at display scale in Signal Yellow with a simple trophy icon.
- Score breakdown per round is available via an expandable section, not shown by default.

### 14.4 Motion Principles

- Round start: the plate tile flips in (CSS 3D card-flip, ~300ms). Serves as a clear "go" signal.
- Timer urgency: progress bar colour shifts from Yellow → Orange → Red in the final 20% of time.
- Submission feedback: 150ms flash only; do not distract from typing flow.
- All animations respect `prefers-reduced-motion`.

### 14.5 Layout & Responsiveness

- Design base: 390px wide (iPhone 14 viewport).
- Single-column layout throughout; no horizontal scrolling.
- Tap targets minimum 48×48px.
- On wider screens (≥768px), content is centred in a max-width container of 480px.

---

## 15. Open Questions / Future Considerations

- **Dictionary source:** Which specific lemma lists/tagged dictionaries will be used for Italian and English? This determines the quality of inflection/proper noun filtering. Good candidates for Italian: Morfo-it lemma database; for English: SCOWL or a Wiktionary lemma dump.
- **Tie-break display:** Should tied players on the final leaderboard be ranked equally, or broken by join order?
- **Ordered match edge case:** If the word contains the 4 plate letters in order but one letter appears multiple times in the word (e.g. plate `C R A D`, word `CRACCAD`), confirm the ordered-match rule still applies (the first occurrence of each plate letter is used for subsequence matching).
- **Letter frequency weighting:** Uniform random is implemented in v1; revisit if playtests produce too many awkward letter combinations.
