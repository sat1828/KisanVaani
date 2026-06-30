import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fetch from 'node-fetch';
import { prisma } from '../lib/prismaClient';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
});

/**
 * POST /api/contact
 *
 * Replaces the previous frontend-only fake "Message Sent!" state, which
 * called setTimeout and lied to the user — nothing was ever persisted or
 * sent anywhere. This endpoint:
 *   1. Validates input.
 *   2. ALWAYS persists the message to the database first. This is the
 *      actual source of truth — even if email delivery fails, the
 *      message is not lost.
 *   3. Attempts to send a notification email via the Resend HTTP API
 *      (https://resend.com) if RESEND_API_KEY is configured. Uses a
 *      plain fetch call rather than the Resend SDK, since no new
 *      dependency is needed for one HTTP call.
 *   4. Only reports success to the user based on step 2 (DB persistence)
 *      actually succeeding — never fakes it.
 */
router.post('/', async (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      `Invalid contact form data: ${parsed.error.errors.map((e) => e.message).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  const { name, email, phone, message } = parsed.data;

  let saved;
  try {
    saved = await prisma.contactMessage.create({
      data: { name, email, phone, message },
    });
  } catch (dbError) {
    logger.error('Failed to persist contact message', { error: dbError });
    throw new AppError(
      'Could not save your message right now. Please try again in a moment, or email us directly.',
      503,
      'CONTACT_PERSIST_FAILED'
    );
  }

  let emailSent = false;
  const resendApiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL;

  if (resendApiKey && notifyEmail) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL || 'KisanVaani Contact Form <onboarding@resend.dev>',
          to: [notifyEmail],
          reply_to: email,
          subject: `New contact form message from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'not provided'}\n\nMessage:\n${message}`,
        }),
      });
      emailSent = emailRes.ok;
      if (!emailRes.ok) {
        logger.warn('Resend API returned non-OK for contact notification', { status: emailRes.status });
      }
    } catch (emailError) {
      logger.warn('Contact notification email failed (message still saved)', { error: emailError });
    }

    if (emailSent) {
      try {
        await prisma.contactMessage.update({ where: { id: saved.id }, data: { emailSent: true } });
      } catch {
        // Non-fatal — the message is already saved either way.
      }
    }
  } else {
    logger.info('RESEND_API_KEY / CONTACT_NOTIFY_EMAIL not configured — message saved to DB only', { id: saved.id });
  }

  res.status(201).json({
    success: true,
    message: 'Thank you — your message has been received. We will get back to you soon.',
    emailNotificationSent: emailSent,
  });
});

export default router;
