import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { validateApiKey } from '../middleware/auth';

function mockReq(apiKey?: string): any {
  return { headers: apiKey ? { 'x-api-key': apiKey } : {} };
}

describe('validateApiKey', () => {
  const originalKey = process.env.API_KEY;
  before(() => { process.env.API_KEY = 'test-secret-key-123'; });
  after(() => { process.env.API_KEY = originalKey; });

  test('calls next() with no error when the key matches', () => {
    let nextArg: any = 'not-called';
    validateApiKey(mockReq('test-secret-key-123'), {} as any, (err?: any) => { nextArg = err; });
    assert.equal(nextArg, undefined);
  });

  test('calls next(error) when the key is wrong', () => {
    let nextArg: any = 'not-called';
    validateApiKey(mockReq('wrong-key'), {} as any, (err?: any) => { nextArg = err; });
    assert.ok(nextArg, 'expected an error to be passed to next()');
    assert.equal(nextArg.statusCode, 401);
  });

  test('calls next(error) when the key is missing entirely', () => {
    let nextArg: any = 'not-called';
    validateApiKey(mockReq(), {} as any, (err?: any) => { nextArg = err; });
    assert.ok(nextArg, 'expected an error to be passed to next()');
  });

  test('rejects a key that differs only in length without throwing', () => {
    let nextArg: any = 'not-called';
    validateApiKey(mockReq('short'), {} as any, (err?: any) => { nextArg = err; });
    assert.ok(nextArg, 'expected an error, not a crash, for mismatched-length keys');
  });
});
