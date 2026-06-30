import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fetch from 'node-fetch';
import { prisma } from '../lib/prismaClient';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

const marketQuerySchema = z.object({
  commodity: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  market: z.string().optional(),
  days: z.coerce.number().min(1).max(30).default(7),
});

type TrendDirection = 'up' | 'down' | 'stable' | 'unknown';

interface MarketPriceResponse {
  commodity: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  trend: string;
  trendDirection: TrendDirection;
  fetchedAt: string;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const parsed = marketQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }

    const { commodity, state, district, market } = parsed.data;

    const cacheMaxAge = new Date();
    cacheMaxAge.setHours(cacheMaxAge.getHours() - 3);

    const cachedPrices = await prisma.marketPrice.findMany({
      where: {
        ...(commodity && { commodity: { contains: commodity, mode: 'insensitive' } }),
        ...(state && { state: { contains: state, mode: 'insensitive' } }),
        ...(district && { district: { contains: district, mode: 'insensitive' } }),
        ...(market && { market: { contains: market, mode: 'insensitive' } }),
        fetchedAt: { gte: cacheMaxAge },
      },
      orderBy: { fetchedAt: 'desc' },
      take: 20,
    });

    let priceRows = cachedPrices;

    if (priceRows.length === 0) {
      const fetched = await fetchMarketPrices(commodity, state, district);
      if (fetched.length === 0) {
        throw new AppError(
          `No market data found${commodity ? ` for ${commodity}` : ''}. Try a different search.`,
          404,
          'MARKET_DATA_NOT_FOUND'
        );
      }
      try {
        await prisma.marketPrice.createMany({ data: fetched, skipDuplicates: true });
      } catch (dbError) {
        logger.warn('Market price DB cache write failed (non-fatal)', { error: dbError });
      }
      priceRows = fetched as any[];
    }

    const response = await formatMarketResponse(priceRows);
    res.json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Market API error', { error });
    throw new AppError('Failed to fetch market prices', 502, 'MARKET_API_ERROR');
  }
});

router.get('/commodities', async (_req: Request, res: Response) => {
  const commodities = [
    'Rice', 'Wheat', 'Cotton', 'Maize', 'Sugarcane',
    'Tomato', 'Potato', 'Onion', 'Chilli', 'Turmeric',
    'Mustard', 'Groundnut', 'Soybean', 'Pigeon Pea (Arhar)',
    'Chickpea (Chana)', 'Green Gram (Moong)', 'Black Gram (Urad)',
    'Mango', 'Banana', 'Orange',
  ];
  res.json({ commodities });
});

async function fetchMarketPrices(
  commodity?: string,
  state?: string,
  district?: string
): Promise<any[]> {
  const apiKey = process.env.MARKET_API_KEY;
  const baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

  if (apiKey) {
    try {
      const params = new URLSearchParams({
        'api-key': apiKey,
        format: 'json',
        limit: '20',
        ...(commodity && { 'filters[commodity]': commodity }),
        ...(state && { 'filters[state]': state }),
        ...(district && { 'filters[district]': district }),
      });

      const res = await fetch(`${baseUrl}?${params}`);
      if (res.ok) {
        const data: any = await res.json();
        if (data.records?.length > 0) {
          return data.records.map((r: any) => ({
            commodity: r.commodity,
            market: r.market,
            district: r.district || district,
            state: r.state || state,
            minPrice: parseFloat(r.min_price) || 0,
            maxPrice: parseFloat(r.max_price) || 0,
            modalPrice: parseFloat(r.modal_price) || 0,
            unit: 'quintal',
            trend: 'stable',
            fetchedAt: new Date(),
          }));
        }
      }
    } catch (e) {
      logger.warn('AGMARKNET API failed, using fallback data', { error: e });
    }
  }

  return getFallbackPrices(commodity);
}

/**
 * Static fallback used only when MARKET_API_KEY isn't configured or the
 * government API is unreachable. These numbers are illustrative — they
 * are NOT live and will drift from reality. They exist so the demo/UI
 * doesn't show an empty state, not as a source of truth for real trading
 * decisions. Configure MARKET_API_KEY for real data.
 */
function getFallbackPrices(commodity?: string) {
  const fallback = [
    { commodity: 'Rice', market: 'Azadpur', district: 'Delhi', state: 'Delhi', minPrice: 2200, maxPrice: 2800, modalPrice: 2500, unit: 'quintal' },
    { commodity: 'Wheat', market: 'Khanna', district: 'Ludhiana', state: 'Punjab', minPrice: 2150, maxPrice: 2400, modalPrice: 2275, unit: 'quintal' },
    { commodity: 'Cotton', market: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', minPrice: 6200, maxPrice: 7500, modalPrice: 6800, unit: 'quintal' },
    { commodity: 'Maize', market: 'Davangere', district: 'Davangere', state: 'Karnataka', minPrice: 1950, maxPrice: 2200, modalPrice: 2075, unit: 'quintal' },
    { commodity: 'Tomato', market: 'Kolar', district: 'Kolar', state: 'Karnataka', minPrice: 1200, maxPrice: 1800, modalPrice: 1500, unit: 'quintal' },
    { commodity: 'Potato', market: 'Agra', district: 'Agra', state: 'Uttar Pradesh', minPrice: 800, maxPrice: 1200, modalPrice: 950, unit: 'quintal' },
    { commodity: 'Onion', market: 'Lasalgaon', district: 'Nashik', state: 'Maharashtra', minPrice: 1500, maxPrice: 2100, modalPrice: 1850, unit: 'quintal' },
    { commodity: 'Soybean', market: 'Indore', district: 'Indore', state: 'Madhya Pradesh', minPrice: 4100, maxPrice: 4600, modalPrice: 4350, unit: 'quintal' },
  ].map((p) => ({ ...p, fetchedAt: new Date() }));

  if (commodity) {
    return fallback.filter((p) => p.commodity.toLowerCase().includes(commodity.toLowerCase()));
  }
  return fallback;
}

/**
 * Computes trend from REAL historical rows (last 7 days, excluding the
 * latest row) rather than from the bid-ask spread of a single snapshot.
 * Returns 'unknown' — not a guess — when there isn't enough history yet.
 * This is what makes a 'down' trend reachable, unlike the previous
 * spread-based formula which could mathematically never report a fall.
 */
/**
 * Pure trend-direction math, isolated from the DB lookup so it can be
 * unit tested without a database (see src/__tests__/market.test.ts).
 * This is the piece that was previously computed from same-snapshot
 * min/max spread and could mathematically never report 'down' — now it's
 * a straightforward percentage change against a prior average.
 */
export function computeTrendDirection(modalPrice: number, avgPrior: number): { label: string; direction: TrendDirection } {
  if (!Number.isFinite(avgPrior) || avgPrior <= 0) {
    return { label: 'Trend: Itihaas uplabdh nahi (pehli baar dekha gaya)', direction: 'unknown' };
  }
  const changeRatio = (modalPrice - avgPrior) / avgPrior;
  if (changeRatio > 0.02) return { label: '₹ Badh raha hai ↑', direction: 'up' };
  if (changeRatio < -0.02) return { label: '₹ Gir raha hai ↓', direction: 'down' };
  return { label: '₹ Sthir hai →', direction: 'stable' };
}

async function calculateTrend(latest: any): Promise<{ label: string; direction: TrendDirection }> {
  let history: { modalPrice: number }[] = [];
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    history = await prisma.marketPrice.findMany({
      where: {
        commodity: latest.commodity,
        market: latest.market,
        fetchedAt: { gte: sevenDaysAgo, lt: latest.fetchedAt ?? new Date() },
      },
      select: { modalPrice: true },
    });
  } catch (err) {
    logger.warn('Trend history query failed (non-fatal)', { error: err });
  }

  if (history.length === 0) {
    return { label: 'Trend: Itihaas uplabdh nahi (pehli baar dekha gaya)', direction: 'unknown' };
  }

  const avgPrior = history.reduce((sum, h) => sum + h.modalPrice, 0) / history.length;
  return computeTrendDirection(latest.modalPrice, avgPrior);
}

async function formatMarketResponse(prices: any[]): Promise<{ prices: MarketPriceResponse[]; summary?: string }> {
  const formatted: MarketPriceResponse[] = await Promise.all(
    prices.map(async (p) => {
      const trend = await calculateTrend(p);
      return {
        commodity: p.commodity,
        market: p.market,
        district: p.district || '',
        state: p.state || '',
        minPrice: p.minPrice ?? p.min_price,
        maxPrice: p.maxPrice ?? p.max_price,
        modalPrice: p.modalPrice ?? p.modal_price,
        unit: p.unit || 'quintal',
        trend: trend.label,
        trendDirection: trend.direction,
        fetchedAt: (p.fetchedAt instanceof Date ? p.fetchedAt : new Date(p.fetchedAt ?? Date.now())).toISOString(),
      };
    })
  );

  let summary: string | undefined;
  if (formatted.length > 0) {
    const latest = formatted[0];
    summary = `${latest.commodity} ka aaj ${latest.market} mandi mein bhav hai: ₹${latest.modalPrice}/${latest.unit}. Trend: ${latest.trend}.`;
  }

  return { prices: formatted, summary };
}

/**
 * Reusable plain-text market summary for the chat fallback path
 * (services/claude.ts) — pulls the same real/cached data this endpoint
 * serves, instead of duplicating a separate hardcoded string elsewhere.
 */
export async function getMarketSummaryText(commodity?: string): Promise<string> {
  try {
    const cacheMaxAge = new Date();
    cacheMaxAge.setHours(cacheMaxAge.getHours() - 3);

    let rows = await prisma.marketPrice.findMany({
      where: {
        ...(commodity && { commodity: { contains: commodity, mode: 'insensitive' } }),
        fetchedAt: { gte: cacheMaxAge },
      },
      orderBy: { fetchedAt: 'desc' },
      take: 5,
    });

    if (rows.length === 0) {
      rows = (await fetchMarketPrices(commodity)) as any[];
    }

    if (rows.length === 0) {
      return 'Mandi bhav abhi uplabdh nahi hai. Kripya thodi der baad try karein ya Market section dekhein.';
    }

    const { prices, summary } = await formatMarketResponse(rows);
    const lines = prices.slice(0, 5).map(
      (p) => `• ${p.commodity} (${p.market}): ₹${p.modalPrice}/${p.unit} — ${p.trend}`
    );
    return `💰 Mandi bhav:\n\n${lines.join('\n')}\n\n${summary ?? ''}`.trim();
  } catch (err) {
    logger.warn('getMarketSummaryText failed', { error: err });
    return 'Mandi bhav abhi load nahi ho paya. Kripya dubara try karein.';
  }
}

/**
 * Background job: periodically refreshes cached prices for the most
 * commonly asked commodities so real 7-day price history actually
 * accumulates (the trend calculation above needs it). Call once from
 * index.ts at startup; it self-schedules via setInterval.
 *
 * Deliberately implemented with plain setInterval (no node-cron) since
 * this is a fixed-period refresh, not a calendar-based schedule — no
 * extra dependency needed.
 */
export function startMarketRefreshJob(intervalMs = 3 * 60 * 60 * 1000): NodeJS.Timeout {
  const commonCommodities = ['Rice', 'Wheat', 'Cotton', 'Maize', 'Tomato', 'Potato', 'Onion', 'Soybean'];

  const run = async () => {
    for (const commodity of commonCommodities) {
      try {
        const fetched = await fetchMarketPrices(commodity);
        if (fetched.length > 0) {
          await prisma.marketPrice.createMany({ data: fetched, skipDuplicates: true });
        }
      } catch (err) {
        logger.warn('Market refresh job failed for commodity', { commodity, error: err });
      }
    }
    logger.info('Market refresh job completed', { commodities: commonCommodities.length });
  };

  setTimeout(run, 10_000);
  return setInterval(run, intervalMs);
}

export default router;
