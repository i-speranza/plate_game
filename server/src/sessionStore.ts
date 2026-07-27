import { randomBytes } from 'node:crypto';
import type {
  Language,
  LeaderboardEntry,
  MatchSettings,
  Player,
  RoundResult,
  SessionPhase,
  SessionSnapshot,
  Submission,
} from '@plate-game/shared';
import { DEFAULT_SETTINGS, ROUND_COUNTDOWN_MS } from '@plate-game/shared';

const PASSCODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const COUNTDOWN_MS = ROUND_COUNTDOWN_MS;

export interface InternalPlayer extends Player {
  socketId: string | null;
}

export interface GameSession {
  passcode: string;
  createdAt: number;
  lastActivityAt: number;
  phase: SessionPhase;
  settings: MatchSettings;
  players: Map<string, InternalPlayer>;
  hostId: string;
  currentRound: number;
  letters: string[];
  roundStartedAt: number | null;
  roundDurationMs: number;
  countdownEndsAt: number | null;
  roundResults: RoundResult[];
  previousRanks: Record<string, number>;
  countdownTimer: ReturnType<typeof setTimeout> | null;
  roundTimer: ReturnType<typeof setInterval> | null;
  roundEndTimer: ReturnType<typeof setTimeout> | null;
}

function generateId(): string {
  return randomBytes(8).toString('hex');
}

function generatePasscode(): string {
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += PASSCODE_CHARS[bytes[i] % PASSCODE_CHARS.length];
  }
  return code;
}

function uniqueNickname(base: string, players: Map<string, InternalPlayer>): string {
  const existing = new Set([...players.values()].map((p) => p.nickname.toLowerCase()));
  if (!existing.has(base.toLowerCase())) return base;

  let suffix = 2;
  while (existing.has(`${base}${suffix}`.toLowerCase())) {
    suffix++;
  }
  return `${base}${suffix}`;
}

function buildLeaderboard(
  players: InternalPlayer[],
  scoreFn: (p: InternalPlayer) => number,
  previousRanks: Record<string, number>,
): LeaderboardEntry[] {
  const sorted = [...players]
    .map((p) => ({ playerId: p.id, nickname: p.nickname, score: scoreFn(p) }))
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));

  const entries: LeaderboardEntry[] = [];
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      rank = i + 1;
    }
    const prevRank = previousRanks[sorted[i].playerId];
    entries.push({
      ...sorted[i],
      rank,
      rankChange: prevRank !== undefined ? prevRank - rank : undefined,
    });
  }
  return entries;
}

export class SessionStore {
  private sessions = new Map<string, GameSession>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000);
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    for (const session of this.sessions.values()) {
      this.clearTimers(session);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [passcode, session] of this.sessions) {
      if (now - session.lastActivityAt > SESSION_TTL_MS) {
        this.clearTimers(session);
        this.sessions.delete(passcode);
      }
    }
  }

  private touch(session: GameSession): void {
    session.lastActivityAt = Date.now();
  }

  clearTimers(session: GameSession): void {
    if (session.countdownTimer) clearTimeout(session.countdownTimer);
    if (session.roundTimer) clearInterval(session.roundTimer);
    if (session.roundEndTimer) clearTimeout(session.roundEndTimer);
    session.countdownTimer = null;
    session.roundTimer = null;
    session.roundEndTimer = null;
  }

  createSession(nickname: string, socketId: string): GameSession {
    let passcode = generatePasscode();
    while (this.sessions.has(passcode)) {
      passcode = generatePasscode();
    }

    const hostId = generateId();
    const player: InternalPlayer = {
      id: hostId,
      nickname: nickname.trim(),
      isHost: true,
      connected: true,
      totalScore: 0,
      gaveUp: false,
      bestSubmission: null,
      socketId,
    };

    const session: GameSession = {
      passcode,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      phase: 'lobby',
      settings: { ...DEFAULT_SETTINGS },
      players: new Map([[hostId, player]]),
      hostId,
      currentRound: 0,
      letters: [],
      roundStartedAt: null,
      roundDurationMs: DEFAULT_SETTINGS.durationSec * 1000,
      countdownEndsAt: null,
      roundResults: [],
      previousRanks: {},
      countdownTimer: null,
      roundTimer: null,
      roundEndTimer: null,
    };

    this.sessions.set(passcode, session);
    return session;
  }

  joinSession(
    passcode: string,
    nickname: string,
    socketId: string,
  ): { session: GameSession; player: InternalPlayer } | { error: string } {
    const session = this.sessions.get(passcode.toUpperCase());
    if (!session) return { error: 'Session not found' };

    this.touch(session);
    const trimmed = nickname.trim();

    const existing = [...session.players.values()].find(
      (p) => p.nickname.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existing) {
      existing.connected = true;
      existing.socketId = socketId;
      return { session, player: existing };
    }

    const uniqueName = uniqueNickname(trimmed, session.players);
    const player: InternalPlayer = {
      id: generateId(),
      nickname: uniqueName,
      isHost: false,
      connected: true,
      totalScore: 0,
      gaveUp: false,
      bestSubmission: null,
      socketId,
    };

    session.players.set(player.id, player);
    return { session, player };
  }

  getSession(passcode: string): GameSession | undefined {
    return this.sessions.get(passcode.toUpperCase());
  }

  getSessionByPlayerId(playerId: string): GameSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.players.has(playerId)) return session;
    }
    return undefined;
  }

  disconnectPlayer(playerId: string): GameSession | undefined {
    const session = this.getSessionByPlayerId(playerId);
    if (!session) return undefined;

    const player = session.players.get(playerId);
    if (player) {
      player.connected = false;
      player.socketId = null;
    }
    this.touch(session);
    return session;
  }

  getConnectedPlayers(session: GameSession): InternalPlayer[] {
    return [...session.players.values()].filter((p) => p.connected);
  }

  toSnapshot(session: GameSession): SessionSnapshot {
    const players = [...session.players.values()].map(({ socketId: _, ...p }) => p);
    const roundScores: Record<string, number> = {};
    for (const p of players) {
      roundScores[p.id] = p.bestSubmission?.score ?? 0;
    }

    const roundLeaderboard = buildLeaderboard(
      [...session.players.values()],
      (p) => p.bestSubmission?.score ?? 0,
      session.previousRanks,
    );

    const cumulativeLeaderboard = buildLeaderboard(
      [...session.players.values()],
      (p) => p.totalScore,
      session.previousRanks,
    );

    const maxScore = cumulativeLeaderboard.length > 0 ? cumulativeLeaderboard[0].score : 0;
    const winners = cumulativeLeaderboard
      .filter((e) => e.score === maxScore && maxScore > 0)
      .map((e) => e.playerId);

    return {
      passcode: session.passcode,
      phase: session.phase,
      settings: session.settings,
      players,
      hostId: session.hostId,
      currentRound: session.currentRound,
      totalRounds: session.settings.rounds,
      letters: session.letters,
      roundStartedAt: session.roundStartedAt,
      roundDurationMs: session.roundDurationMs,
      countdownEndsAt: session.countdownEndsAt,
      roundResults: session.roundResults,
      roundLeaderboard,
      cumulativeLeaderboard,
      winners,
    };
  }

  updateSettings(session: GameSession, settings: Partial<MatchSettings>): void {
    if (session.phase !== 'lobby') return;
    if (settings.rounds !== undefined) {
      session.settings.rounds = Math.min(20, Math.max(1, settings.rounds));
    }
    if (settings.durationSec !== undefined) {
      session.settings.durationSec = Math.min(300, Math.max(10, settings.durationSec));
      session.roundDurationMs = session.settings.durationSec * 1000;
    }
    if (settings.language !== undefined) {
      session.settings.language = settings.language;
    }
    if (settings.revealPossibleSolution !== undefined) {
      session.settings.revealPossibleSolution = settings.revealPossibleSolution;
    }
    this.touch(session);
  }

  resetForPlayAgain(session: GameSession): void {
    this.clearTimers(session);
    session.phase = 'lobby';
    session.currentRound = 0;
    session.letters = [];
    session.roundStartedAt = null;
    session.countdownEndsAt = null;
    session.roundResults = [];
    session.previousRanks = {};

    for (const player of session.players.values()) {
      player.totalScore = 0;
      player.gaveUp = false;
      player.bestSubmission = null;
    }
    this.touch(session);
  }

  resetRoundPlayerState(session: GameSession): void {
    for (const player of session.players.values()) {
      player.gaveUp = false;
      player.bestSubmission = null;
    }
  }

  recordSubmission(
    session: GameSession,
    playerId: string,
    submission: Submission,
  ): void {
    const player = session.players.get(playerId);
    if (!player) return;

    if (!player.bestSubmission || submission.score > player.bestSubmission.score) {
      player.bestSubmission = submission;
    } else if (
      player.bestSubmission &&
      submission.score === player.bestSubmission.score &&
      submission.elapsedMs < player.bestSubmission.elapsedMs
    ) {
      player.bestSubmission = submission;
    }
    this.touch(session);
  }

  finalizeRound(
    session: GameSession,
    solutionReveal?: { revealedSolution?: string; noOrderedSolution?: boolean },
  ): RoundResult {
    const submissions: Record<string, Submission | null> = {};
    const roundScores: Record<string, number> = {};

    for (const [id, player] of session.players) {
      submissions[id] = player.bestSubmission;
      const score = player.bestSubmission?.score ?? 0;
      roundScores[id] = score;
      player.totalScore += score;
    }

    const result: RoundResult = {
      roundNumber: session.currentRound,
      letters: [...session.letters],
      submissions,
      roundScores,
      ...(solutionReveal?.revealedSolution ? { revealedSolution: solutionReveal.revealedSolution } : {}),
      ...(solutionReveal?.noOrderedSolution ? { noOrderedSolution: true } : {}),
    };

    session.roundResults.push(result);

    const cumulative = buildLeaderboard(
      [...session.players.values()],
      (p) => p.totalScore,
      session.previousRanks,
    );
    session.previousRanks = Object.fromEntries(cumulative.map((e) => [e.playerId, e.rank]));

    return result;
  }
}

export { COUNTDOWN_MS };
