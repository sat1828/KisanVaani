/**
 * Zero-dependency structured logger.
 *
 * Emits single-line JSON to stdout/stderr so logs are machine-parseable by
 * any log aggregator (CloudWatch, Loki, Datadog, etc.) without requiring a
 * dedicated logging package. Falls back to readable text in development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === 'production';

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    service: 'kisanvaani-backend',
    ...fields,
  };

  const line = isProd ? JSON.stringify(entry) : formatHuman(level, message, fields);
  const stream = level === 'error' || level === 'warn' ? console.error : console.log;
  stream(line);
}

function formatHuman(level: LogLevel, message: string, fields?: LogFields): string {
  const prefix = { debug: '🔍', info: 'ℹ️ ', warn: '⚠️ ', error: '❌' }[level];
  const extra = fields && Object.keys(fields).length ? ' ' + JSON.stringify(fields) : '';
  return `${prefix} ${message}${extra}`;
}

export const logger = {
  debug: (message: string, fields?: LogFields) => {
    if (!isProd) emit('debug', message, fields);
  },
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields) => emit('warn', message, fields),
  error: (message: string, fields?: LogFields) => {
    if (fields?.error instanceof Error) {
      fields = { ...fields, error: fields.error.message, stack: fields.error.stack };
    }
    emit('error', message, fields);
  },
};
