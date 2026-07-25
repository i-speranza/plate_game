import type { ScoreTier } from './types.js';

export interface ScoreBand {
  tier: ScoreTier;
  maxScore: number;
  minScore: number;
  matchCount: number | 'ordered';
}

/** Score band ranges — edit here to tune scoring without touching game logic. */
export const SCORE_CONFIG = {
  bands: [
    { tier: 'ordered', maxScore: 1500, minScore: 1200, matchCount: 'ordered' },
    { tier: 'fourLetter', maxScore: 1000, minScore: 800, matchCount: 4 },
    { tier: 'threeLetter', maxScore: 800, minScore: 600, matchCount: 3 },
    { tier: 'twoLetter', maxScore: 600, minScore: 400, matchCount: 2 },
    { tier: 'oneLetter', maxScore: 0, minScore: 0, matchCount: 1 },
  ] satisfies ScoreBand[],
};
