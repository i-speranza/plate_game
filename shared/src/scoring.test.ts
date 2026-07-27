import { describe, expect, it } from 'vitest';
import {
  countDistinctPlateLetters,
  getMatchingPlateIndices,
  isOrderedMatch,
} from './letterMatch.js';
import { getOrderedScoreBand, getScoreBand } from './scoringConfig.js';
import { calculateScore, determineTier, scoreWord } from './scoring.js';

const plate = ['C', 'R', 'A', 'D'];
const durationMs = 60_000;
const orderedBand = getOrderedScoreBand(4)!;
const fourLetterBand = getScoreBand('fourLetter')!;
const threeLetterBand = getScoreBand('threeLetter')!;
const twoLetterBand = getScoreBand('twoLetter')!;

describe('letter matching', () => {
  it('counts distinct plate letters', () => {
    expect(countDistinctPlateLetters('CARD', plate)).toBe(4);
    expect(countDistinctPlateLetters('ACCORDIO', plate)).toBe(4);
    expect(countDistinctPlateLetters('CARO', plate)).toBe(3);
    expect(countDistinctPlateLetters('HELLO', plate)).toBe(0);
  });

  it('counts duplicate plate letters using word letter availability', () => {
    const duplicatePlate = ['R', 'L', 'R', 'P'];

    expect(countDistinctPlateLetters('ALLORA', duplicatePlate)).toBe(2);
    expect(countDistinctPlateLetters('ARRUOLARE', duplicatePlate)).toBe(3);
    expect(countDistinctPlateLetters('PARLARE', duplicatePlate)).toBe(4);
  });

  it('detects ordered subsequence match', () => {
    expect(isOrderedMatch('CURVARD', plate)).toBe(true);
    expect(isOrderedMatch('CRACCAD', plate)).toBe(true);
    expect(isOrderedMatch('DRACENA', plate)).toBe(false);
  });

  it('supports variable plate lengths for ordered match', () => {
    const threeLetterPlate = ['C', 'R', 'A'];
    expect(isOrderedMatch('CURA', threeLetterPlate)).toBe(true);
    expect(isOrderedMatch('ARCO', threeLetterPlate)).toBe(false);
  });

  it('returns which plate letters matched', () => {
    expect(getMatchingPlateIndices('CARO', plate)).toEqual([true, true, true, false]);
    expect(getMatchingPlateIndices('CURVARD', plate)).toEqual([true, true, true, true]);
  });

  it('handles duplicate plate letters when resolving matches', () => {
    const duplicatePlate = ['R', 'L', 'R', 'P'];

    expect(getMatchingPlateIndices('ALLORA', duplicatePlate)).toEqual([true, true, false, false]);
    expect(getMatchingPlateIndices('PARLARE', duplicatePlate)).toEqual([true, true, true, true]);
  });
});

describe('scoring tiers', () => {
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

  it('assigns tiers with duplicate plate letters based on available word letters', () => {
    const duplicatePlate = ['R', 'L', 'R', 'P'];

    expect(determineTier('ALLORA', duplicatePlate)).toBe('twoLetter');
    expect(determineTier('ARRUOLARE', duplicatePlate)).toBe('threeLetter');
  });

  it('assigns tiers for 3-letter plates', () => {
    const threePlate = ['C', 'R', 'A'];
    expect(determineTier('CURA', threePlate)).toBe('ordered');
    expect(determineTier('ARCO', threePlate)).toBe('threeLetter');
    expect(determineTier('CARO', threePlate)).toBe('threeLetter');
  });

  it('assigns tiers for 5-letter plates', () => {
    const fivePlate = ['C', 'R', 'A', 'D', 'E'];
    expect(determineTier('CARO', fivePlate)).toBe('threeLetter');
    expect(determineTier('CEDRA', fivePlate)).toBe('fiveLetter');
  });

  it('assigns tiers for 6-letter plates', () => {
    const sixPlate = ['C', 'R', 'A', 'D', 'E', 'F'];
    expect(determineTier('CEDRAF', sixPlate)).toBe('sixLetter');
    expect(determineTier('CRADEF', sixPlate)).toBe('ordered');
  });

  it('scores at round start with max values', () => {
    const result = scoreWord('CURVARD', plate, 0, durationMs);
    expect(result.tier).toBe('ordered');
    expect(result.score).toBe(orderedBand.maxScore);
  });

  it('scores at round end with min values', () => {
    expect(calculateScore('ordered', durationMs, durationMs, 4)).toBe(orderedBand.minScore);
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

  it('uses ordered bands scaled to plate letter count', () => {
    const threeOrdered = getOrderedScoreBand(3)!;
    const result = scoreWord('CURA', ['C', 'R', 'A'], 0, durationMs);
    expect(result.tier).toBe('ordered');
    expect(result.score).toBe(threeOrdered.maxScore);
    expect(threeOrdered.maxScore).toBe(1400);
    expect(threeOrdered.minScore).toBe(1100);
  });

  it('uses updated score ranges for match counts', () => {
    expect(fourLetterBand.maxScore).toBe(1200);
    expect(fourLetterBand.minScore).toBe(1000);
    expect(threeLetterBand.maxScore).toBe(900);
    expect(threeLetterBand.minScore).toBe(700);
    expect(orderedBand.maxScore).toBe(1700);
    expect(orderedBand.minScore).toBe(1400);
  });
});
