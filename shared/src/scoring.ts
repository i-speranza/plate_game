import { countDistinctPlateLetters, isOrderedMatch } from './letterMatch.js';
import type { ScoreTier } from './types.js';
import { SCORE_CONFIG } from './scoringConfig.js';

export { SCORE_CONFIG } from './scoringConfig.js';
export type { ScoreBand } from './scoringConfig.js';

export function determineTier(word: string, plateLetters: string[]): ScoreTier {
  const matchCount = countDistinctPlateLetters(word, plateLetters);

  if (matchCount === 0) return 'none';
  if (matchCount === 1) return 'oneLetter';
  if (matchCount === 2) return 'twoLetter';
  if (matchCount === 3) return 'threeLetter';
  if (isOrderedMatch(word, plateLetters)) return 'ordered';
  return 'fourLetter';
}

export function calculateScore(
  tier: ScoreTier,
  elapsedMs: number,
  roundDurationMs: number,
): number {
  if (tier === 'none' || tier === 'oneLetter') return 0;

  const band = SCORE_CONFIG.bands.find((b) => b.tier === tier);
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
  const score = calculateScore(tier, elapsedMs, roundDurationMs);
  return { tier, score, matchCount };
}
