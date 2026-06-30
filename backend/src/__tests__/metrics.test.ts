import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { httpRequestsTotal, renderMetrics } from '../lib/metrics';

describe('metrics', () => {
  test('renderMetrics produces Prometheus-exposition-format text', () => {
    httpRequestsTotal.inc({ route: '/health', method: 'GET', status: '200' });
    const text = renderMetrics();
    assert.match(text, /# HELP http_requests_total/);
    assert.match(text, /# TYPE http_requests_total counter/);
    assert.match(text, /http_requests_total\{.*route="\/health".*\}\s+\d+/);
  });

  test('counter accumulates across multiple increments with the same labels', () => {
    httpRequestsTotal.inc({ route: '/test-accumulate', method: 'GET', status: '200' });
    httpRequestsTotal.inc({ route: '/test-accumulate', method: 'GET', status: '200' });
    httpRequestsTotal.inc({ route: '/test-accumulate', method: 'GET', status: '200' });
    const text = renderMetrics();
    const match = text.match(/http_requests_total\{[^}]*route="\/test-accumulate"[^}]*\}\s+(\d+)/);
    assert.ok(match, 'expected to find the accumulated counter line');
    assert.equal(Number(match![1]), 3);
  });
});
