/**
 * Minimal, zero-dependency metrics registry exposed in Prometheus text
 * exposition format at GET /metrics. No prom-client needed.
 *
 * This is intentionally simple: counters and a basic latency histogram.
 * If you outgrow this, swap in `prom-client` later — the /metrics route
 * contract (plain text exposition format) won't need to change.
 */

interface Counter {
  value: number;
  labels: Record<string, string>;
}

class CounterMetric {
  private series = new Map<string, Counter>();
  constructor(private name: string, private help: string) {}

  inc(labels: Record<string, string> = {}, amount = 1) {
    const key = this.labelKey(labels);
    const existing = this.series.get(key);
    if (existing) {
      existing.value += amount;
    } else {
      this.series.set(key, { value: amount, labels });
    }
  }

  private labelKey(labels: Record<string, string>): string {
    return Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`).join(',');
  }

  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const { value, labels } of this.series.values()) {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`)
        .join(',');
      lines.push(`${this.name}${labelStr ? `{${labelStr}}` : ''} ${value}`);
    }
    return lines.join('\n');
  }
}

class HistogramMetric {
  private buckets: number[];
  private counts = new Map<string, number[]>();
  private sums = new Map<string, number>();
  private totals = new Map<string, number>();

  constructor(private name: string, private help: string, buckets: number[]) {
    this.buckets = buckets;
  }

  observe(value: number, labels: Record<string, string> = {}) {
    const key = this.labelKey(labels);
    if (!this.counts.has(key)) {
      this.counts.set(key, new Array(this.buckets.length).fill(0));
      this.sums.set(key, 0);
      this.totals.set(key, 0);
    }
    const bucketCounts = this.counts.get(key)!;
    this.buckets.forEach((b, i) => {
      if (value <= b) bucketCounts[i] += 1;
    });
    this.sums.set(key, this.sums.get(key)! + value);
    this.totals.set(key, this.totals.get(key)! + 1);
  }

  private labelKey(labels: Record<string, string>): string {
    return Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`).join(',') || '__default__';
  }

  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const [key, bucketCounts] of this.counts.entries()) {
      const labelPart = key === '__default__' ? '' : key.split(',').map(p => {
        const [k, v] = p.split('=');
        return `${k}="${v}"`;
      }).join(',');
      const wrap = (le: string) => labelPart ? `{${labelPart},le="${le}"}` : `{le="${le}"}`;
      this.buckets.forEach((b, i) => {
        lines.push(`${this.name}_bucket${wrap(String(b))} ${bucketCounts[i]}`);
      });
      lines.push(`${this.name}_bucket${wrap('+Inf')} ${this.totals.get(key)}`);
      const sumLabel = labelPart ? `{${labelPart}}` : '';
      lines.push(`${this.name}_sum${sumLabel} ${this.sums.get(key)}`);
      lines.push(`${this.name}_count${sumLabel} ${this.totals.get(key)}`);
    }
    return lines.join('\n');
  }
}

export const httpRequestsTotal = new CounterMetric(
  'http_requests_total',
  'Total HTTP requests by route and status code'
);

export const aiCallsTotal = new CounterMetric(
  'ai_calls_total',
  'Total calls to the AI provider, by outcome (success/failure/fallback)'
);

export const crisisFlagsTotal = new CounterMetric(
  'crisis_flags_total',
  'Total messages flagged as a potential personal crisis'
);

export const dbErrorsTotal = new CounterMetric(
  'db_errors_total',
  'Total database operation failures, by operation'
);

export const requestLatencyMs = new HistogramMetric(
  'http_request_duration_ms',
  'HTTP request latency in milliseconds',
  [50, 100, 250, 500, 1000, 2500, 5000, 10000]
);

export function renderMetrics(): string {
  return [
    httpRequestsTotal.render(),
    aiCallsTotal.render(),
    crisisFlagsTotal.render(),
    dbErrorsTotal.render(),
    requestLatencyMs.render(),
  ].join('\n\n') + '\n';
}
