import { AppError } from '../middleware/errorHandler';
import { prisma } from '../lib/prismaClient';
import { logger } from '../lib/logger';
import { withRetry, safeFetchUserSuppliedUrl } from '../lib/safeFetch';
import { aiCallsTotal, crisisFlagsTotal } from '../lib/metrics';
import { getQuickSprayAdvisory } from '../api/weather';
import { getMarketSummaryText } from '../api/market';

interface GenerateResponseParams {
  inputText: string;
  inputType: 'text' | 'voice' | 'image';
  imageUrl?: string;
  farmerProfile: any;
  language: string;
  farmerName?: string;
  sessionId?: string;
}

interface GenerateResponseResult {
  text: string;
  diagnosis?: string;
  confidence?: number;
  treatment?: string;
  weatherData?: any;
  marketData?: any;
  /** True when the real AI service failed and we fell back to the
   *  rule-based/database path. The caller/frontend should surface this so
   *  it isn't presented with the same confidence as a real AI diagnosis. */
  degraded?: boolean;
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const MAX_SESSION_TURNS = 6; // 6 user+assistant pairs = 12 messages of history

const SYSTEM_PROMPT = `You are Krishak Mitra (कृषक मित्र) — a multilingual, voice-first agricultural intelligence agent.
You serve smallholder farmers across India, Sub-Saharan Africa, and Southeast Asia.

CRITICAL RULES:
1. Respond in the farmer's language. Detect the language from their message.
2. Use SHORT sentences. Max 15 words per sentence for voice-friendliness.
3. NEVER use technical jargon without explaining in simple terms.
4. If diagnosing a disease, follow this structure:
   a) Name the problem (local name first)
   b) How confident you are (Pakka / Lagbhag / Andaza)
   c) What to do TODAY (immediate action)
   d) Home remedy (sasta upaay)
   e) Chemical option (dawai ka naam + matra)
   f) Prevention for remaining crop
   g) When to expect improvement
5. For weather: give spray/irrigation advice based on conditions
6. For market prices: give trend + recommendation (sell now / wait)
7. NEVER recommend banned pesticides (Monocrotophos, Methyl Parathion, Phorate, Endosulfan, etc.)
8. ALWAYS include safety warnings for chemical use
9. If farmer seems distressed or mentions suicide/barbaad, IMMEDIATELY provide mental health support
10. Numbers as words: "paanch kilo" not "5 kg"
11. If a "Known diseases for this crop" reference block is provided below, treat it as your
    primary, verified source. Only suggest something outside that list if the farmer's
    described symptoms clearly don't match any entry — and say explicitly that this is
    outside your verified database and confidence should be lower.
12. If an image is provided, describe what you can actually observe in it before diagnosing.
    Do not claim a confidence level higher than what the image quality and described symptoms
    actually support.

CONFIDENCE LEVELS:
- High (80-100%): "Yeh beemari pakki hai. Mujhe poora yakeen hai."
- Medium (50-80%): "Yeh ho sakta hai. Do teen cheezein check karein."
- Low (<50%): "Sahi nahi bata sakta. Kuch aur batao."

DIAGNOSTIC PROTOCOL:
For crop problems, ask:
1. Kaunsi fasal?
2. Kaunsa hissa prabhavit? (patta / tana / jad / phal / danaa / poora paudha)
3. Kaisa dikhta hai? (rang badal / dhabbe / sukha / gala / chhed / powder / cheepchap)
4. Kitni tezi se phail raha? (ek paudha / line / poora khet)
5. Haal ka mausam? (bhaari barish / sukh / pala / baadh)
6. Koi khad/dawai dali?`;

/**
 * Crisis keyword sets, by language. This is a coarse pre-filter, not a
 * clinical instrument — it exists to make sure we never respond to a
 * farmer in genuine distress with an agricultural answer. When the real
 * Anthropic API is configured, the model itself is also instructed (rule
 * 9 above) to recognize distress contextually, which catches phrasing
 * this keyword list misses. Expand this list per deployment region/language
 * rather than relying on it alone.
 */
const CRISIS_KEYWORDS: Record<string, string[]> = {
  hi: [
    'barbaad', 'khatam', 'kuch nahi bacha', 'karz mein doob', 'jaan de doonga',
    'jaan de dungi', 'mar jaaunga', 'mar jaungi', 'zindagi khatam', 'khud ko khatam',
    'aatma hatya', 'suicide kar', 'jeene ka man nahi',
  ],
  en: [
    'suicide', 'kill myself', 'end my life', 'no reason to live',
    'better off dead', 'want to die', "can't go on",
  ],
  sw: [
    'kujiua', 'sina sababu ya kuishi', 'maisha yamekwisha',
  ],
};

export function detectCrisis(inputText: string): boolean {
  const lower = inputText.toLowerCase();
  for (const keywords of Object.values(CRISIS_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return true;
  }
  return false;
}

/**
 * Crisis response text + resources. IMPORTANT: only includes helpline
 * numbers that have been independently verified as real and current
 * (Tele MANAS and KIRAN are national, government-run mental health
 * helplines in India; Kisan Call Centre is the real national farmer
 * helpline). We deliberately do NOT fabricate region-specific helpline
 * numbers for Sub-Saharan Africa / Southeast Asia deployments — if you
 * deploy there, add verified local crisis line numbers here per region
 * before going live. Showing a wrong/dead number in a crisis response
 * would be worse than showing none.
 */
function getCrisisResponse(): GenerateResponseResult {
  return {
    text: `Aapki baat sun ke dil bhaari ho gaya.\nPehle aap batao — aap theek hain?\n\n📞 Tele MANAS (mental health, 24/7, free): 14416 ya 1800-891-4416\n📞 KIRAN helpline: 1800-599-0019\n📞 Kisan Call Centre: 1800-180-1551\n\nAap akele nahi hain. Yeh log baat karne ke liye hi hain.\n\nFasal ki chinta abhi mat karo — hum baad mein dekh lenge.\nKya main kisi aur tarah se madad kar sakta hoon?`,
    diagnosis: 'CRISIS_RESPONSE',
    confidence: 1.0,
  };
}

export async function generateResponse(params: GenerateResponseParams): Promise<GenerateResponseResult> {
  const { inputText, inputType, imageUrl, farmerProfile, language, sessionId } = params;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (detectCrisis(inputText)) {
      crisisFlagsTotal.inc({ channel: params.farmerName ? 'web' : 'unknown' });
      logger.warn('Crisis keywords detected in farmer message', { sessionId, language });
      return getCrisisResponse();
    }

    const history = sessionId ? await loadSessionHistory(sessionId) : [];

    let result: GenerateResponseResult;

    if (apiKey && apiKey !== 'demo') {
      try {
        result = await withRetry(
          () => callClaudeAPI(apiKey, { inputText, imageUrl, farmerProfile, language, history }),
          { retries: 2, label: 'Claude API call' }
        );
        aiCallsTotal.inc({ outcome: 'success' });
      } catch (err) {
        aiCallsTotal.inc({ outcome: 'failure' });
        logger.error('Claude API failed after retries, using grounded fallback', { error: err });
        result = await ruleBasedResponse(inputText, language, farmerProfile);
        result.degraded = true;
      }
    } else {
      aiCallsTotal.inc({ outcome: 'fallback_no_key' });
      result = await ruleBasedResponse(inputText, language, farmerProfile);
    }

    if (sessionId) {
      await saveSessionTurn(sessionId, language, farmerProfile?.phoneNumber, inputText, result.text);
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Claude service error', { error });
    throw new AppError('AI response generation failed', 500, 'AI_SERVICE_ERROR');
  }
}

// ---------------------------------------------------------------------------
// Session / multi-turn memory
// ---------------------------------------------------------------------------

interface SessionTurn {
  role: 'user' | 'assistant';
  content: string;
}

async function loadSessionHistory(sessionId: string): Promise<SessionTurn[]> {
  try {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session?.context) return [];
    const context = session.context as unknown as SessionTurn[];
    return Array.isArray(context) ? context : [];
  } catch {
    logger.warn('Session lookup failed, proceeding without history', { sessionId });
    return [];
  }
}

async function saveSessionTurn(
  sessionId: string,
  language: string,
  phoneNumber: string | undefined,
  userText: string,
  assistantText: string
): Promise<void> {
  try {
    const existing = await loadSessionHistory(sessionId);
    const updated = [
      ...existing,
      { role: 'user' as const, content: userText },
      { role: 'assistant' as const, content: assistantText },
    ].slice(-MAX_SESSION_TURNS * 2);

    await prisma.session.upsert({
      where: { id: sessionId },
      update: { context: updated as unknown as object, updatedAt: new Date() },
      create: { id: sessionId, phoneNumber, language, context: updated as unknown as object },
    });
  } catch (err) {
    logger.warn('Failed to persist session turn (non-fatal)', { sessionId, error: err });
  }
}

// ---------------------------------------------------------------------------
// DiseaseDB grounding (RAG-lite)
// ---------------------------------------------------------------------------

const CROP_ALIASES: Record<string, string[]> = {
  rice: ['dhan', 'dhaan', 'chawal', 'paddy', 'rice'],
  wheat: ['gehun', 'gehu', 'kannak', 'wheat'],
  cotton: ['kapaas', 'kapas', 'cotton'],
  maize: ['makka', 'maize', 'corn'],
  tomato: ['tamatar', 'tomato'],
  banana: ['kela', 'banana'],
};

function detectCrop(inputText: string, farmerProfile: any): string | undefined {
  const lower = inputText.toLowerCase();
  for (const [crop, aliases] of Object.entries(CROP_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) return crop;
  }
  const primaryCrop = farmerProfile?.primaryCrops?.[0];
  if (primaryCrop) {
    const normalized = String(primaryCrop).toLowerCase();
    for (const [crop, aliases] of Object.entries(CROP_ALIASES)) {
      if (aliases.includes(normalized) || crop === normalized) return crop;
    }
  }
  return undefined;
}

interface DiseaseMatch {
  disease: any;
  score: number;
}

/**
 * Scores DiseaseDB entries against the farmer's free-text message by
 * counting how many distinct words from each disease's symptom list
 * appear in the input, with a small bonus if the current month is in the
 * disease's known season window. This is intentionally simple (no ML, no
 * embeddings) so it's auditable and runs with zero external dependencies
 * — but it means real database content beats a single hardcoded guess.
 */
async function findDiseaseMatches(inputText: string, farmerProfile: any, limit = 3): Promise<DiseaseMatch[]> {
  const crop = detectCrop(inputText, farmerProfile);
  const lower = inputText.toLowerCase();
  const currentMonth = new Date().getMonth() + 1;

  let candidates: any[];
  try {
    candidates = await prisma.diseaseDB.findMany({
      where: crop ? { crop } : undefined,
    });
  } catch (err) {
    logger.warn('DiseaseDB query failed (DB unavailable)', { error: err });
    return [];
  }

  const scored: DiseaseMatch[] = candidates.map((disease) => {
    let score = 0;
    for (const symptom of disease.symptoms as string[]) {
      const words = symptom.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
      if (words.some((w) => lower.includes(w))) score += 1;
    }
    if (disease.seasonMonths?.includes(currentMonth)) score += 0.5;
    return { disease, score };
  });

  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildGroundingBlock(matches: DiseaseMatch[]): string {
  if (matches.length === 0) return '';
  const entries = matches.map(({ disease }) => {
    return [
      `- ${disease.name}${disease.localName ? ` (${disease.localName})` : ''} [${disease.crop}]`,
      `  Symptoms: ${(disease.symptoms as string[]).join('; ')}`,
      disease.organicTreatment ? `  Organic: ${disease.organicTreatment}` : null,
      disease.chemicalTreatment ? `  Chemical: ${disease.chemicalTreatment}` : null,
      disease.prevention ? `  Prevention: ${disease.prevention}` : null,
    ].filter(Boolean).join('\n');
  }).join('\n');

  return `\n\nKnown diseases for this crop/season (verified database — treat as primary source):\n${entries}`;
}

// ---------------------------------------------------------------------------
// Real Claude API call (text + vision + multi-turn)
// ---------------------------------------------------------------------------

interface CallClaudeParams {
  inputText: string;
  imageUrl?: string;
  farmerProfile: any;
  language: string;
  history: SessionTurn[];
}

async function callClaudeAPI(apiKey: string, params: CallClaudeParams): Promise<GenerateResponseResult> {
  const { inputText, imageUrl, farmerProfile, language, history } = params;
  const fetch = (await import('node-fetch')).default;

  let farmerContext = '';
  if (farmerProfile) {
    const parts: string[] = [];
    if (farmerProfile.name) parts.push(`Farmer name: ${farmerProfile.name}`);
    if (farmerProfile.state) parts.push(`State/Region: ${farmerProfile.state}`);
    if (farmerProfile.district) parts.push(`District: ${farmerProfile.district}`);
    if (farmerProfile.primaryCrops?.length) parts.push(`Primary crops: ${farmerProfile.primaryCrops.join(', ')}`);
    if (farmerProfile.soilType) parts.push(`Soil type: ${farmerProfile.soilType}`);
    if (farmerProfile.irrigationType) parts.push(`Irrigation: ${farmerProfile.irrigationType}`);
    farmerContext = parts.join('\n');
  }

  const diseaseMatches = await findDiseaseMatches(inputText, farmerProfile);
  const groundingBlock = buildGroundingBlock(diseaseMatches);
  const systemPrompt = SYSTEM_PROMPT + groundingBlock;

  let userTextPrompt = `Language: ${language}\n`;
  if (farmerContext) userTextPrompt += `\nFarmer Context:\n${farmerContext}\n\n`;
  userTextPrompt += `Farmer says: ${inputText}`;

  // Build the current turn's content — plain text, or text + real image block.
  let currentContent: any = userTextPrompt;
  if (imageUrl) {
    try {
      const imageRes = await safeFetchUserSuppliedUrl(imageUrl);
      if (!imageRes.ok) throw new Error(`Image fetch returned ${imageRes.status}`);
      const buffer = await imageRes.buffer();
      if (buffer.length > 5 * 1024 * 1024) {
        throw new AppError('Image too large (max 5MB)', 400, 'IMAGE_TOO_LARGE');
      }
      const mediaType = imageRes.headers.get('content-type') || 'image/jpeg';
      const base64Image = buffer.toString('base64');
      currentContent = [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text', text: userTextPrompt },
      ];
    } catch (err) {
      logger.warn('Failed to fetch/attach farmer image, proceeding text-only', { imageUrl, error: err });
      currentContent = `${userTextPrompt}\n\n(Note: an image was submitted but could not be retrieved for analysis. Ask the farmer to resend it, and answer based on text only for now.)`;
    }
  }

  const messages = [
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
    { role: 'user', content: currentContent },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Claude API error', { status: response.status, body: errorText });
    throw new AppError('AI service failed', 502, 'CLAUDE_API_ERROR');
  }

  const result: any = await response.json();
  const text = result.content?.find((b: any) => b.type === 'text')?.text || '';

  const diagnosis = extractDiagnosis(text);
  const confidence = extractConfidence(text);
  const treatment = extractTreatment(text);

  return { text, diagnosis, confidence, treatment };
}

// ---------------------------------------------------------------------------
// Offline / no-API-key fallback — grounded in the real DiseaseDB, no
// single hardcoded diagnosis. Honest about its own limitations.
// ---------------------------------------------------------------------------

async function ruleBasedResponse(
  inputText: string,
  language: string,
  farmerProfile: any
): Promise<GenerateResponseResult> {
  const lowerInput = inputText.toLowerCase();

  // Weather queries — pull a real quick advisory if we have a location,
  // otherwise ask for one instead of inventing a forecast.
  if (lowerInput.includes('mausam') || lowerInput.includes('mosam') || lowerInput.includes('weather') ||
      lowerInput.includes('baarish') || lowerInput.includes('barish') || lowerInput.includes('rain') ||
      lowerInput.includes('chhidkav') || lowerInput.includes('spray') || lowerInput.includes('sinchai') ||
      lowerInput.includes('paani') || lowerInput.includes('irrigat')) {
    const text = await getQuickSprayAdvisory(farmerProfile?.lat, farmerProfile?.lon);
    return { text };
  }

  // Market price queries — use real cached/fallback market data, not
  // hardcoded numbers that drift from reality over time.
  if (lowerInput.includes('bhav') || lowerInput.includes('price') || lowerInput.includes('mandi') ||
      lowerInput.includes('bhaav') || lowerInput.includes('daam') || lowerInput.includes('rate') ||
      lowerInput.includes('market')) {
    const commodity = farmerProfile?.primaryCrops?.[0];
    const text = await getMarketSummaryText(commodity);
    return { text };
  }

  // Disease/pest queries — match against the real, seeded DiseaseDB.
  // No single hardcoded disease is ever returned regardless of input.
  const looksLikeDiseaseQuery =
    Object.values(CROP_ALIASES).some((aliases) => aliases.some((a) => lowerInput.includes(a))) ||
    ['patta', 'patti', 'leaf', 'peela', 'yellow', 'dhabba', 'spot', 'sukha', 'beemari', 'bimari',
      'rog', 'keeda', 'kida', 'insect', 'ladka', 'illa'].some((k) => lowerInput.includes(k));

  if (looksLikeDiseaseQuery) {
    const matches = await findDiseaseMatches(inputText, farmerProfile, 1);
    if (matches.length > 0) {
      const { disease, score } = matches[0];
      const confidence = Math.min(0.5 + score * 0.1, 0.85);
      const text = formatDiseaseAnswer(disease, confidence);
      return {
        text,
        diagnosis: `${disease.name}${disease.localName ? ` (${disease.localName})` : ''}`,
        confidence,
        treatment: disease.chemicalTreatment || disease.organicTreatment,
      };
    }

    // Honest "I don't know" instead of a fabricated diagnosis.
    return {
      text: `Mujhe aapke symptoms se pakki diagnosis nahi mil rahi (rule-based demo mode mein, bina live AI ke).\n\nKripya zara aur batao:\n1. Kaunsi fasal hai?\n2. Kaunsa hissa prabhavit hai? (patta / tana / jad / phal)\n3. Kaisa dikhta hai? (rang, dhabbe, sukhna, ghalna)\n4. Kitni tezi se phail raha hai?\n\nMain dobara dekhunga. Behtar diagnosis ke liye is system mein live AI key (ANTHROPIC_API_KEY) configure karein.`,
    };
  }

  // Greeting
  if (['namaste', 'hello', 'hi', 'namaskar'].some((g) => lowerInput.includes(g))) {
    const nameStr = farmerProfile?.name ? ` ${farmerProfile.name} ji` : '';
    const cropStr = farmerProfile?.primaryCrops?.length
      ? ` Aapke ${farmerProfile.primaryCrops[0]} ka kya haal hai?`
      : '';
    return {
      text: `Namaste${nameStr}! 🙏\nMain Krishak Mitra hoon — aapka kisan salahkar.${cropStr}\n\nMain in cheezon mein madad kar sakta hoon:\n🌾 Fasal ki beemari / keeda\n🌤️ Mausam aur chhidkav\n💰 Mandi bhav\n\nApni samasya batao — main turant madad karunga.`,
    };
  }

  const nameStr = farmerProfile?.name ? ` ${farmerProfile.name} ji` : '';
  return {
    text: `Namaste${nameStr}! 🙏\nMain samajh gaya aapki baat.\n\nKripya zara aur batao:\n1. Kaunsi fasal hai?\n2. Kaunsa hissa prabhavit hai?\n3. Kaisa dikhta hai?\n4. Kitni tezi se phail raha hai?\n\nMain turant diagnosis karunga.`,
  };
}

function formatDiseaseAnswer(disease: any, confidence: number): string {
  const confidenceLabel = confidence >= 0.8 ? 'Lagbhag pakka' : confidence >= 0.6 ? 'Ho sakta hai' : 'Andaza hai, pakka nahi';
  const lines = [
    `🌾 Mumkin samasya: ${disease.name}${disease.localName ? ` (${disease.localName})` : ''}`,
    `\n${confidenceLabel} — ${Math.round(confidence * 100)}% confidence (database match, live AI nahi).`,
  ];
  if (disease.chemicalTreatment) lines.push(`\n🔴 Dawai: ${disease.chemicalTreatment}`);
  if (disease.organicTreatment) lines.push(`\n🌿 Sasta upaay: ${disease.organicTreatment}`);
  if (disease.prevention) lines.push(`\n✅ Aage ke liye: ${disease.prevention}`);
  lines.push(`\n⚠️ Dawai ka istemal karte waqt label zaroor padhein aur suraksha upkaran (gloves, mask) pehnein.`);
  lines.push(`\nKya yeh symptoms match karte hain, ya kuch alag hai?`);
  return lines.join('\n');
}

function extractDiagnosis(text: string): string | undefined {
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('blight') || lower.includes('blast') || lower.includes('rust') ||
        lower.includes('smut') || lower.includes('wilt') || lower.includes('hopper') ||
        lower.includes('worm') || lower.includes('fly') || lower.includes('mildew') ||
        lower.includes('rot') || lower.includes('curl') || lower.includes('mosaic') ||
        lower.includes('virus') || lower.includes('bacter')) {
      const match = line.match(/[A-Za-z\s]+(Blight|Blast|Rust|Smut|Wilt|Rot|Mildew|Worm|Fly|Hopper|Curl|Mosaic|Virus)/i);
      if (match) return match[0].trim();
      return line.replace(/^[•\-\d.]+/, '').trim().substring(0, 50);
    }
  }
  return undefined;
}

function extractConfidence(text: string): number | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('pakki') || lower.includes('pura yakeen') || lower.includes('100%') ||
      lower.includes('bilkul') || lower.includes('pukka')) return 0.9;
  if (lower.includes('70%') || lower.includes('80%') || lower.includes('ho sakta') ||
      lower.includes('lagbhag')) return 0.7;
  if (lower.includes('30%') || lower.includes('50%') || lower.includes('sahi nahi') ||
      lower.includes('andaaj') || lower.includes('andaza')) return 0.4;
  return undefined;
}

function extractTreatment(text: string): string | undefined {
  const lines = text.split('\n');
  const treatments = [
    'validamycin', 'hexaconazole', 'tricyclazole', 'buprofezin', 'tebuconazole',
    'propiconazole', 'mancozeb', 'metalaxyl', 'emamectin', 'spinosad',
    'spiromesifen', 'imidacloprid', 'dimethoate', 'carboxin', 'chlorothalonil',
    'copper', 'neem', 'sulfur', 'zinc sulfate', 'urea',
  ];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (treatments.some((t) => lower.includes(t))) {
      return line.replace(/^[•\-\d.]+/, '').trim().substring(0, 100);
    }
  }
  return undefined;
}
