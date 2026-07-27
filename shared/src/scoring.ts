import { countDistinctPlateLetters, isOrderedMatch } from './letterMatch.js';
import type { ScoreTier } from './types.js';
import { getScoreBand, matchCountToTier } from './scoringConfig.js';

export {
  SCORE_CONFIG,
  getDisplayScoreBands,
  getMatchScoreBand,
  getOrderedScoreBand,
  getScoreBand,
  matchCountToTier,
} from './scoringConfig.js';
export type { ScoreBand } from './scoringConfig.js';

export function determineTier(word: string, plateLetters: string[]): ScoreTier {
  const plateCount = plateLetters.length;
  const matchCount = countDistinctPlateLetters(word, plateLetters);

  if (matchCount === 0) return 'none';
  if (matchCount >= plateCount) {
    return isOrderedMatch(word, plateLetters) ? 'ordered' : matchCountToTier(plateCount);
  }
  return matchCountToTier(matchCount);
}

export function calculateScore(
  tier: ScoreTier,
  elapsedMs: number,
  roundDurationMs: number,
  plateLetterCount?: number,
): number {
  if (tier === 'none' || tier === 'oneLetter') return 0;

  const band = getScoreBand(tier, plateLetterCount);
  if (!band) return 0;

  const f = Math.min(1, Math.max(0, elapsedMs / roundDurationMs));
  const range = band.maxScore - band.minScore;
  return Math.round(band.maxScore - range * f);
}

export function scoreWord(
  word: string,
  plateLetters: string[],
  elapsedMs: number,
  roundDurationMs: number,
): { tier: ScoreTier; score: number; matchCount: number } {
  const matchCount = countDistinctPlateLetters(word, plateLetters);
  const tier = determineTier(word, plateLetters);
  const score = calculateScore(tier, elapsedMs, roundDurationMs, plateLetters.length);
  return { tier, score, matchCount };
}
