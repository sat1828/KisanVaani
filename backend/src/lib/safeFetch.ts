import fetch, { Response } from 'node-fetch';
import { AppError } from '../middleware/errorHandler';
import { logger } from './logger';

/**
 * Private/loopback/link-local IP ranges. Even if a hostname is technically
 * allowlisted, we never want to fetch something that resolves into one of
 * these ranges (defends against DNS rebinding and against someone passing
 * a raw IP literal in the allowlist by mistake).
 */
const BLOCKED_IP_PATTERNS = [
  /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./, /^0\./,
  /^::1$/, /^fc00:/i, /^fe80:/i,
];

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost') return true;
  return BLOCKED_IP_PATTERNS.some((re) => re.test(h));
}

/**
 * Returns the allowlisted hosts permitted for outbound *image* fetches
 * (farmer-submitted photo URLs). This is intentionally narrow: only our
 * own upload storage domain and Twilio's media CDN should ever be fetched
 * server-side based on a URL that ultimately originated from user input.
 *
 * Configure via ALLOWED_IMAGE_HOSTS="uploads.yourdomain.com,api.twilio.com"
 */
function getAllowedImageHosts(): string[] {
  const fromEnv = process.env.ALLOWED_IMAGE_HOSTS?.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean) || [];
  // Twilio always serves inbound WhatsApp/voice media from api.twilio.com
  return [...new Set([...fromEnv, 'api.twilio.com'])];
}

/**
 * Safe fetch for any URL that was ultimately derived from user-controlled
 * input (a farmer-submitted imageUrl, a webhook media URL, etc). Throws
 * before making a network call if the host isn't explicitly allowlisted
 * or resolves to a private/internal address pattern.
 */
export async function safeFetchUserSuppliedUrl(url: string): Promise<Response> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError('Invalid URL', 400, 'INVALID_URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new AppError('Only http(s) URLs are allowed', 400, 'INVALID_URL_SCHEME');
  }

  if (isBlockedHost(parsed.hostname)) {
    logger.warn('Blocked SSRF attempt to internal/private host', { hostname: parsed.hostname });
    throw new AppError('This URL host is not permitted', 403, 'BLOCKED_HOST');
  }

  const allowed = getAllowedImageHosts();
  const isAllowed = allowed.some((h) => parsed.hostname.toLowerCase() === h || parsed.hostname.toLowerCase().endsWith(`.${h}`));
  if (!isAllowed) {
    logger.warn('Blocked fetch to non-allowlisted host', { hostname: parsed.hostname, allowed });
    throw new AppError(
      `Image host "${parsed.hostname}" is not in the allowlist. Set ALLOWED_IMAGE_HOSTS to permit it.`,
      403,
      'HOST_NOT_ALLOWED'
    );
  }

  return fetch(url, { redirect: 'error', size: 10 * 1024 * 1024 });
}

/**
 * Retry wrapper with exponential backoff for calls to trusted third-party
 * APIs (Anthropic, OpenWeatherMap, etc) where transient network failures
 * shouldn't immediately surface as a 5xx to the end user.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { retries = 2, baseDelayMs = 400, label = 'operation' } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === retries;
      // Don't retry client errors (4xx) that won't succeed on retry.
      if (err instanceof AppError && err.statusCode >= 400 && err.statusCode < 500) {
        throw err;
      }
      if (isLastAttempt) break;
      const delay = baseDelayMs * 2 ** attempt;
      logger.warn(`${label} failed, retrying`, { attempt: attempt + 1, retries, delayMs: delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
