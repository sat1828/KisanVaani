import OpenAI from 'openai';
import fetch from 'node-fetch';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError('OpenAI API key not configured', 503, 'SERVICE_NOT_CONFIGURED');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function processVoiceNote(
  audioUrl: string,
  language: string = 'hi'
): Promise<string> {
  try {
    const client = getOpenAI();

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      throw new AppError('Failed to download audio file', 502, 'AUDIO_DOWNLOAD_ERROR');
    }

    const audioBuffer = await audioRes.buffer();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    const file = new File([blob], `audio_${Date.now()}.ogg`, { type: 'audio/ogg' });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language,
      response_format: 'json',
    });

    return transcription.text || '';
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Voice processing error', { error });
    throw new AppError('Failed to process voice note', 500, 'VOICE_PROCESSING_ERROR');
  }
}

// NOTE: there used to be a `processImage()` stub here that just returned
// `[Image received from ${imageUrl}]` without doing any actual analysis —
// a placeholder pretending to be a feature. It's been removed. Image
// understanding for WhatsApp/voice photo submissions now goes through the
// same real Claude vision pipeline as the web chat (see
// services/claude.ts -> callClaudeAPI, which fetches the image via the
// SSRF-safe fetcher and sends it to Claude as a real vision content
// block). Callers should pass the media URL straight through as
// `imageUrl` to `generateResponse()` instead of pre-processing it here.

export async function textToSpeech(
  text: string,
  language: string = 'hi-IN',
  voice: string = 'alloy'
): Promise<Buffer> {
  try {
    const client = getOpenAI();

    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text.substring(0, 4096),
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    logger.error('TTS error', { error });
    throw new AppError('Failed to generate speech', 500, 'TTS_ERROR');
  }
}

