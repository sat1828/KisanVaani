import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateResponse } from '../services/claude';
import { validateApiKey } from '../middleware/auth';
import { prisma } from '../lib/prismaClient';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  language: z.string().min(2).max(5).default('hi'),
  phoneNumber: z.string().optional(),
  sessionId: z.string().optional(),
  farmerName: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

router.post('/', validateApiKey, async (req: Request, res: Response) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors.map((e) => e.message).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { message, language, phoneNumber, farmerName, imageUrl } = parsed.data;
    // Always have a sessionId, even on the very first message of a new
    // conversation, so multi-turn memory (services/claude.ts) works from
    // turn one instead of only kicking in once the client happens to
    // echo one back.
    const sessionId = parsed.data.sessionId || crypto.randomUUID();

    let farmerProfile = null;
    if (phoneNumber) {
      try {
        farmerProfile = await prisma.farmerProfile.findUnique({ where: { phoneNumber } });
      } catch (err) {
        logger.warn('DB unavailable, proceeding without farmer profile', { error: err });
      }
    }

    const startTime = Date.now();

    const response = await generateResponse({
      inputText: message,
      inputType: imageUrl ? 'image' : 'text',
      imageUrl,
      farmerProfile,
      language,
      farmerName,
      sessionId,
    });

    const latencyMs = Date.now() - startTime;

    if (phoneNumber || sessionId) {
      prisma.queryLog
        .create({
          data: {
            farmerId: farmerProfile?.id,
            sessionId,
            channel: 'web',
            inputType: imageUrl ? 'image' : 'text',
            inputText: message,
            inputMediaUrl: imageUrl,
            responseText: response.text,
            diagnosis: response.diagnosis,
            confidence: response.confidence,
            treatment: response.treatment,
            language,
            latencyMs,
          },
        })
        .catch((err) => logger.warn('Failed to log query (non-fatal)', { error: err }));
    }

    res.json({
      success: true,
      response: response.text,
      diagnosis: response.diagnosis || null,
      confidence: response.confidence ?? null,
      treatment: response.treatment || null,
      language,
      latencyMs,
      sessionId,
      degraded: response.degraded ?? false,
      ...(response.weatherData && { weatherData: response.weatherData }),
      ...(response.marketData && { marketData: response.marketData }),
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Chat API error', { error });
    throw new AppError('Failed to process chat message', 500, 'CHAT_PROCESSING_ERROR');
  }
});

export default router;
