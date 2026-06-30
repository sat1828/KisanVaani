import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { validateTwilioRequest } from '../middleware/auth';
import { processVoiceNote } from '../services/whisper';
import { generateResponse } from '../services/claude';
import { prisma } from '../lib/prismaClient';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

let twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
  if (!twilioClient) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

// All three webhook routes are signature-validated, in every environment.
// An unsigned webhook endpoint is a live cost-abuse vector (it can trigger
// outbound Twilio sends and paid AI calls) regardless of NODE_ENV — the
// previous code only validated /whatsapp, and only outside non-production
// environments, which left staging/demo wide open.
router.post('/whatsapp', validateTwilioRequest, async (req: Request, res: Response) => {
  try {
    const { Body, From, MediaUrl0, MediaContentType0, ProfileName, SmsSid } = req.body;

    if (!From) {
      throw new AppError('Missing phone number', 400, 'MISSING_FIELD');
    }

    const phoneNumber = From.replace('whatsapp:', '');
    let inputText: string | undefined = Body?.trim();
    let inputType: 'text' | 'voice' | 'image' = 'text';
    let mediaUrl: string | undefined;
    let imageUrlForVision: string | undefined;

    if (MediaUrl0 && MediaContentType0) {
      if (MediaContentType0.startsWith('image/')) {
        inputType = 'image';
        mediaUrl = MediaUrl0;
        imageUrlForVision = MediaUrl0;
        // Real vision analysis happens inside generateResponse() via the
        // Claude vision content block — we no longer pre-process the
        // image into a fake placeholder string here. If the farmer sent
        // a caption along with the photo, use it; otherwise give the
        // model a sensible default prompt for "diagnose this photo".
        inputText = inputText || 'Is tasveer mein kya samasya hai? Kripya dekh kar bataye.';
      } else if (MediaContentType0.startsWith('audio/')) {
        inputType = 'voice';
        mediaUrl = MediaUrl0;
        inputText = await processVoiceNote(MediaUrl0, 'hi');
      }
    }

    if (!inputText) {
      throw new AppError('No input text or media provided', 400, 'MISSING_INPUT');
    }

    let farmer: any = { phoneNumber, preferredLang: 'hi' };
    try {
      farmer = await prisma.farmerProfile.upsert({
        where: { phoneNumber },
        update: {
          name: ProfileName || undefined,
          lastInteraction: new Date(),
          queryCount: { increment: 1 },
        },
        create: {
          phoneNumber,
          name: ProfileName || null,
          preferredChannel: 'whatsapp',
          lastInteraction: new Date(),
          queryCount: 1,
        },
      });
    } catch (err) {
      logger.warn('DB unavailable for farmer profile lookup (non-fatal)', { error: err });
    }

    const startTime = Date.now();

    const response = await generateResponse({
      inputText,
      inputType,
      imageUrl: imageUrlForVision,
      farmerProfile: farmer,
      language: farmer.preferredLang || 'hi',
      sessionId: SmsSid, // group a WhatsApp conversation thread by Twilio's message SID chain
    });

    const latencyMs = Date.now() - startTime;

    try {
      await prisma.queryLog.create({
        data: {
          farmerId: farmer?.id,
          sessionId: SmsSid,
          channel: 'whatsapp',
          inputType,
          inputText,
          inputMediaUrl: mediaUrl,
          responseText: response.text,
          diagnosis: response.diagnosis,
          confidence: response.confidence,
          treatment: response.treatment,
          language: farmer?.preferredLang || 'hi',
          latencyMs,
          metadata: response.degraded ? { degraded: true } : {},
        },
      });
    } catch (err) {
      logger.warn('Failed to log query (non-fatal)', { error: err });
    }

    try {
      await getTwilioClient().messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phoneNumber}`,
        body: response.text,
      });
    } catch (err) {
      logger.error('Failed to send outbound WhatsApp message', { error: err });
    }

    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>${escapeXml(response.text)}</Message>
      </Response>
    `);
  } catch (error) {
    logger.error('WhatsApp webhook error', { error });

    res.set('Content-Type', 'text/xml');
    res.status(200).send(`
      <Response>
        <Message>Maaf karein, koi error aaya hai. Kripya dubara try karein. 🙏</Message>
      </Response>
    `);
  }
});

router.post('/voice', validateTwilioRequest, async (req: Request, res: Response) => {
  try {
    const { CallStatus, Digits, SpeechResult } = req.body;

    if (CallStatus === 'completed') {
      res.set('Content-Type', 'text/xml');
      res.send(`
        <Response>
          <Say voice="Polly.Aditi" language="hi-IN">
            Dhanyavaad. Aapki call khatam hui hai. Kisan helpline 1800-180-1551 par bhi sampark kar sakte hain.
          </Say>
        </Response>
      `);
      return;
    }

    if (!Digits && !SpeechResult) {
      res.set('Content-Type', 'text/xml');
      res.send(`
        <Response>
          <Gather language="hi-IN" input="dtmf speech" timeout="5" numDigits="1" speechTimeout="auto">
            <Say voice="Polly.Aditi" language="hi-IN">
              Krishak Mitra mein aapka swagat hai. Kripya apni bhasha chunein.
              Hindi ke liye 1 dabayein.
              Telugu ke liye 2 dabayein.
              Kannada ke liye 3 dabayein.
              Ya apni bhasha ka naam bolein.
            </Say>
          </Gather>
          <Say voice="Polly.Aditi" language="hi-IN">
            Maaf karein, samajh nahi aaya. Phir se try karein.
          </Say>
        </Response>
      `);
      return;
    }

    const languageMap: Record<string, string> = {
      '1': 'hi', '2': 'te', '3': 'kn',
      hindi: 'hi', telugu: 'te', kannada: 'kn',
    };

    const langCode = languageMap[Digits] || languageMap[SpeechResult?.toLowerCase()] || 'hi';

    if (!Digits && SpeechResult) {
      const response = await generateResponse({
        inputText: SpeechResult,
        inputType: 'voice',
        farmerProfile: null,
        language: langCode,
      });

      res.set('Content-Type', 'text/xml');
      res.send(`
        <Response>
          <Say voice="Polly.Aditi" language="hi-IN">
            ${escapeXml(response.text.substring(0, 150))}
          </Say>
          <Gather language="hi-IN" input="dtmf speech" timeout="5" numDigits="1">
            <Say voice="Polly.Aditi" language="hi-IN">
              Kya aur poochna chahte hain? Haan ke liye 1, nahi ke liye 2 dabayein.
            </Say>
          </Gather>
          <Say voice="Polly.Aditi" language="hi-IN">Dhanyavaad. Aapka swagat hai.</Say>
        </Response>
      `);
      return;
    }

    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Gather language="hi-IN" input="speech dtmf" timeout="10" speechTimeout="auto">
          <Say voice="Polly.Aditi" language="hi-IN">
            Apni samasya bataayein. Jaise—mere dhan ke patte peele ho rahe hain, ya mausam ka haal, ya mandi ka bhav.
          </Say>
        </Gather>
        <Say voice="Polly.Aditi" language="hi-IN">
          Maaf karein, samajh nahi aaya. Kripya phir se boliye.
        </Say>
      </Response>
    `);
  } catch (error) {
    logger.error('IVR webhook error', { error });
    res.set('Content-Type', 'text/xml');
    res.status(200).send(`
      <Response>
        <Say voice="Polly.Aditi" language="hi-IN">
          Koi technical problem aayi hai. Kripya thodi der baad phir karein.
        </Say>
      </Response>
    `);
  }
});

router.post('/status', validateTwilioRequest, (req: Request, res: Response) => {
  const { MessageStatus, MessageSid, To, From } = req.body;
  logger.info('WhatsApp status update', { MessageStatus, MessageSid, To, From });
  res.sendStatus(200);
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
