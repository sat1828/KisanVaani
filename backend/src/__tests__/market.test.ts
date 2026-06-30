import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeTrendDirection } from '../api/market';

describe('computeTrendDirection', () => {
  test('reports "up" when price rose more than 2% above prior average', () => {
    const result = computeTrendDirection(2600, 2500);
    assert.equal(result.direction, 'up');
  });

  test('reports "down" when price fell more than 2% below prior average', () => {
    // This case is the entire point of the fix: the old spread-based
    // formula (max-min)/mid was mathematically incapable of ever being
    // negative, so 'down' was unreachable dead code. This test would
    // have caught that regression immediately.
    const result = computeTrendDirection(2350, 2500);
    assert.equal(result.direction, 'down');
  });

  test('reports "stable" when price is within +/-2% of prior average', () => {
    const result = computeTrendDirection(2510, 2500);
    assert.equal(result.direction, 'stable');
  });

  test('reports "unknown" when there is no prior average (avgPrior <= 0)', () => {
    const result = computeTrendDirection(2500, 0);
    assert.equal(result.direction, 'unknown');
  });

  test('reports "unknown" when avgPrior is not finite', () => {
    const result = computeTrendDirection(2500, NaN);
    assert.equal(result.direction, 'unknown');
  });

  test('boundary just above +2% threshold is "up", not "stable"', () => {
    const result = computeTrendDirection(2551, 2500); // +2.04%
    assert.equal(result.direction, 'up');
  });

  test('boundary just inside +2% threshold is "stable", not "up"', () => {
    const result = computeTrendDirection(2549, 2500); // +1.96%
    assert.equal(result.direction, 'stable');
  });
});
