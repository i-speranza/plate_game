import { describe, expect, it } from 'vitest';
import { countDistinctPlateLetters, isOrderedMatch } from './letterMatch.js';
import { SCORE_CONFIG } from './scoringConfig.js';
import { calculateScore, determineTier, scoreWord } from './scoring.js';

const orderedBand = SCORE_CONFIG.bands.find((b) => b.tier === 'ordered')!;
const fourLetterBand = SCORE_CONFIG.bands.find((b) => b.tier === 'fourLetter')!;
const threeLetterBand = SCORE_CONFIG.bands.find((b) => b.tier === 'threeLetter')!;
const twoLetterBand = SCORE_CONFIG.bands.find((b) => b.tier === 'twoLetter')!;

describe('letter matching', () => {
  const plate = ['C', 'R', 'A', 'D'];

  it('counts distinct plate letters', () => {
    expect(countDistinctPlateLetters('CARD', plate)).toBe(4);
    expect(countDistinctPlateLetters('ACCORDIO', plate)).toBe(4);
    expect(countDistinctPlateLetters('CARO', plate)).toBe(3);
    expect(countDistinctPlateLetters('HELLO', plate)).toBe(0);
  });

  it('detects ordered subsequence match', () => {
    expect(isOrderedMatch('CURVARD', plate)).toBe(true);
    expect(isOrderedMatch('CRACCAD', plate)).toBe(true);
    expect(isOrderedMatch('DRACENA', plate)).toBe(false);
  });
});

describe('scoring tiers', () => {
  const plate = ['C', 'R', 'A', 'D'];
  const durationMs = 60_000;

  it('assigns ordered tier when letters appear in order', () => {
    expect(determineTier('CURVARD', plate)).toBe('ordered');
    expect(determineTier('CRACCAD', plate)).toBe('ordered');
  });

  it('assigns four-letter tier when all letters present but out of order', () => {
    expect(determineTier('DRAC', plate)).toBe('fourLetter');
  });

  it('assigns partial tiers', () => {
    expect(determineTier('CARO', plate)).toBe('threeLetter');
    expect(determineTier('CA', plate)).toBe('twoLetter');
    expect(determineTier('C', plate)).toBe('oneLetter');
  });

  it('scores at round start with max values', () => {
    const result = scoreWord('CURVARD', plate, 0, durationMs);
    expect(result.tier).toBe('ordered');
    expect(result.score).toBe(orderedBand.maxScore);
  });

  it('scores at round end with min values', () => {
    expect(calculateScore('ordered', durationMs, durationMs)).toBe(orderedBand.minScore);
    expect(calculateScore('fourLetter', durationMs, durationMs)).toBe(fourLetterBand.minScore);
    expect(calculateScore('threeLetter', durationMs, durationMs)).toBe(threeLetterBand.minScore);
    expect(calculateScore('twoLetter', durationMs, durationMs)).toBe(twoLetterBand.minScore);
  });

  it('gives zero for one-letter match', () => {
    const result = scoreWord('C', plate, 0, durationMs);
    expect(result.tier).toBe('oneLetter');
    expect(result.score).toBe(0);
  });

  it('interpolates linearly at midpoint', () => {
    const midpoint =
      fourLetterBand.maxScore -
      (fourLetterBand.maxScore - fourLetterBand.minScore) * 0.5;
    expect(calculateScore('fourLetter', 30_000, durationMs)).toBe(Math.round(midpoint));
  });
});
