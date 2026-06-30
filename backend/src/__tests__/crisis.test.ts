import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectCrisis } from '../services/claude';

describe('detectCrisis', () => {
  test('detects Hindi/Hinglish distress phrasing', () => {
    assert.equal(detectCrisis('ab mujhe lagta hai sab barbaad ho gaya, jeene ka man nahi'), true);
  });

  test('detects English distress phrasing', () => {
    assert.equal(detectCrisis('I just want to end my life, nothing is working'), true);
  });

  test('detects Swahili distress phrasing', () => {
    assert.equal(detectCrisis('sina sababu ya kuishi tena'), true);
  });

  test('does not flag an ordinary disease question', () => {
    assert.equal(detectCrisis('mere dhan ke patte peele ho rahe hain, kya karu'), false);
  });

  test('does not flag an ordinary market price question', () => {
    assert.equal(detectCrisis('aaj cotton ka bhav kya hai'), false);
  });

  test('is case-insensitive', () => {
    assert.equal(detectCrisis('I WANT TO END MY LIFE'), true);
  });
});
