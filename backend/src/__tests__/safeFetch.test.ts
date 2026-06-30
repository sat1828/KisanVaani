import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { safeFetchUserSuppliedUrl } from '../lib/safeFetch';

describe('safeFetchUserSuppliedUrl', () => {
  test('rejects localhost', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('http://localhost/secret'));
  });

  test('rejects loopback IP 127.0.0.1', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('http://127.0.0.1/admin'));
  });

  test('rejects private 10.x range', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('http://10.0.0.5/internal'));
  });

  test('rejects private 192.168.x range', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('http://192.168.1.1/router'));
  });

  test('rejects cloud metadata endpoint 169.254.169.254', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('http://169.254.169.254/latest/meta-data/'));
  });

  test('rejects a non-allowlisted public host', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('https://evil-attacker-site.example.com/x.jpg'));
  });

  test('rejects malformed URLs', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('not-a-url'));
  });

  test('rejects non-http(s) schemes', async () => {
    await assert.rejects(() => safeFetchUserSuppliedUrl('file:///etc/passwd'));
  });
});
