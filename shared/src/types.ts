export type Language = 'it' | 'en';

export type SessionPhase =
  | 'lobby'
  | 'letterPick'
  | 'countdown'
  | 'roundActive'
  | 'roundSummary'
  | 'finalResults';

export type LetterMode = 'random' | 'manual';

export type ScoreTier =
  | 'ordered'
  | 'fourLetter'
  | 'threeLetter'
  | 'twoLetter'
  | 'oneLetter'
  | 'none';

export interface MatchSettings {
  rounds: number;
  durationSec: number;
  language: Language;
}

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  connected: boolean;
  totalScore: number;
  gaveUp: boolean;
  bestSubmission: Submission | null;
}

export interface Submission {
  word: string;
  score: number;
  tier: ScoreTier;
  elapsedMs: number;
}

export interface RoundResult {
  roundNumber: number;
  letters: string[];
  submissions: Record<string, Submission | null>;
  roundScores: Record<string, number>;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  rankChange?: number;
}

export interface SessionSnapshot {
  passcode: string;
  phase: SessionPhase;
  settings: MatchSettings;
  players: Player[];
  hostId: string;
  currentRound: number;
  totalRounds: number;
  letters: string[];
  roundStartedAt: number | null;
  roundDurationMs: number;
  countdownEndsAt: number | null;
  roundResults: RoundResult[];
  roundLeaderboard: LeaderboardEntry[];
  cumulativeLeaderboard: LeaderboardEntry[];
  winners: string[];
}

export type SubmitReasonCode =
  | 'ENTER_WORD'
  | 'NOT_IN_DICTIONARY'
  | 'MUST_CONTAIN_PLATE_LETTER';

export type ServerErrorCode =
  | 'INVALID_NICKNAME'
  | 'INVALID_PASSCODE'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_LETTERS';

export interface SubmitResult {
  valid: boolean;
  reason?: SubmitReasonCode;
  score?: number;
  tier?: ScoreTier;
  matchCount?: number;
}

export const DEFAULT_SETTINGS: MatchSettings = {
  rounds: 5,
  durationSec: 45,
  language: 'it',
};

export const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

export const ALPHABETS: Record<Language, string[]> = {
  it: 'ABCDEFGHILMNOPQRSTUVZ'.split(''),
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
};
