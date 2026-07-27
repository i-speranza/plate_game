import type { ScoreTier } from './types.js';

export interface ScoreBand {
  tier: ScoreTier;
  maxScore: number;
  minScore: number;
  matchCount: number | 'ordered';
}

const MATCH_SCORE_BANDS: Record<number, { maxScore: number; minScore: number }> = {
  1: { maxScore: 0, minScore: 0 },
  2: { maxScore: 600, minScore: 400 },
  3: { maxScore: 900, minScore: 700 },
  4: { maxScore: 1200, minScore: 1000 },
  5: { maxScore: 1500, minScore: 1300 },
  6: { maxScore: 1800, minScore: 1600 },
};

const ORDERED_BONUS_MIN = 200;
const ORDERED_BONUS_MAX = 500;

const TIER_BY_MATCH_COUNT: Record<number, ScoreTier> = {
  1: 'oneLetter',
  2: 'twoLetter',
  3: 'threeLetter',
  4: 'fourLetter',
  5: 'fiveLetter',
  6: 'sixLetter',
};

export function matchCountToTier(matchCount: number): ScoreTier {
  return TIER_BY_MATCH_COUNT[matchCount] ?? 'none';
}

export function getMatchScoreBand(matchCount: number): { maxScore: number; minScore: number } | null {
  return MATCH_SCORE_BANDS[matchCount] ?? null;
}

export function getOrderedScoreBand(plateLetterCount: number): { maxScore: number; minScore: number } | null {
  const full = MATCH_SCORE_BANDS[plateLetterCount];
  if (!full) return null;
  return {
    minScore: full.maxScore + ORDERED_BONUS_MIN,
    maxScore: full.maxScore + ORDERED_BONUS_MAX,
  };
}

export function getScoreBand(tier: ScoreTier, plateLetterCount?: number): { maxScore: number; minScore: number } | null {
  if (tier === 'none') return { maxScore: 0, minScore: 0 };
  if (tier === 'ordered') {
    if (plateLetterCount === undefined) return null;
    return getOrderedScoreBand(plateLetterCount);
  }
  const matchCount = Object.entries(TIER_BY_MATCH_COUNT).find(([, t]) => t === tier)?.[0];
  if (!matchCount) return null;
  return getMatchScoreBand(Number(matchCount));
}

/** Score bands for How-to-play UI: ordered + match tiers down to 1 for a given plate size. */
export function getDisplayScoreBands(letterCount: number): ScoreBand[] {
  const ordered = getOrderedScoreBand(letterCount);
  const bands: ScoreBand[] = [];

  if (ordered) {
    bands.push({ tier: 'ordered', maxScore: ordered.maxScore, minScore: ordered.minScore, matchCount: 'ordered' });
  }

  for (let count = letterCount; count >= 1; count--) {
    const band = MATCH_SCORE_BANDS[count];
    const tier = TIER_BY_MATCH_COUNT[count];
    if (band && tier) {
      bands.push({ tier, maxScore: band.maxScore, minScore: band.minScore, matchCount: count });
    }
  }

  return bands;
}

/** @deprecated Use getScoreBand / getDisplayScoreBands. Kept for backward compatibility during migration. */
export const SCORE_CONFIG = {
  bands: getDisplayScoreBands(4),
};
