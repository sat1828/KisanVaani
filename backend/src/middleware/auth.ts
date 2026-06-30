import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import twilio from 'twilio';
import { AppError } from './errorHandler';
import { logger } from '../lib/logger';

/**
 * Constant-time string comparison so API key checks don't leak timing
 * information about how many leading characters matched.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA); // burn equivalent time, avoid early return
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export const validateApiKey = (req: Request, _res: Response, next: NextFunction): void => {
  const apiKey = (req.headers['x-api-key'] as string) || '';
  const expectedKey = process.env.API_KEY;

  if (expectedKey && !timingSafeStringEqual(apiKey, expectedKey)) {
    next(new AppError('Invalid or missing API key', 401, 'UNAUTHORIZED'));
    return;
  }

  next();
};

/**
 * Validates that an inbound webhook request actually came from Twilio by
 * verifying the X-Twilio-Signature header using Twilio's official HMAC
 * scheme (auth token + full request URL + sorted POST params).
 *
 * This runs in EVERY environment, not just production. A webhook endpoint
 * with no signature verification in staging/demo is a live, exploitable
 * cost-abuse vector regardless of NODE_ENV.
 *
 * Requires PUBLIC_BASE_URL to be set to the exact externally-reachable
 * base URL Twilio is configured to call (e.g. https://api.yourdomain.com).
 */
export const validateTwilioRequest = (req: Request, _res: Response, next: NextFunction): void => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const publicBaseUrl = process.env.PUBLIC_BASE_URL;

  if (!authToken || !publicBaseUrl) {
    // Fail closed: if we can't verify, we don't trust the request. This
    // also surfaces a misconfiguration loudly instead of silently letting
    // unsigned requests through (which is what the previous code did).
    logger.error('Twilio webhook auth misconfigured: missing TWILIO_AUTH_TOKEN or PUBLIC_BASE_URL');
    next(new AppError('Webhook authentication is not configured', 503, 'WEBHOOK_AUTH_NOT_CONFIGURED'));
    return;
  }

  const signature = req.headers['x-twilio-signature'] as string | undefined;
  if (!signature) {
    next(new AppError('Missing Twilio signature', 401, 'UNAUTHORIZED'));
    return;
  }

  const url = `${publicBaseUrl.replace(/\/$/, '')}${req.originalUrl}`;
  const isValid = twilio.validateRequest(authToken, signature, url, req.body);

  if (!isValid) {
    logger.warn('Rejected webhook request with invalid Twilio signature', { url, ip: req.ip });
    next(new AppError('Invalid Twilio signature', 401, 'UNAUTHORIZED'));
    return;
  }

  next();
};
