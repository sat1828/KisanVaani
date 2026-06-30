import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fetch from 'node-fetch';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().min(1).max(7).default(3),
});

interface ForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity: number;
  wind_speed: number;
  rain_probability: number;
  condition: string;
  icon: string;
}

interface WeatherResponse {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    condition: string;
    icon: string;
    feels_like: number;
  };
  forecast: ForecastDay[];
  alert?: {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'danger';
  };
  sprayAdvisory?: {
    safe: boolean;
    reason?: string;
    idealWindow?: string;
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const parsed = weatherQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('Invalid location parameters', 400, 'VALIDATION_ERROR');
    }

    const { lat, lon, days } = parsed.data;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      throw new AppError('Weather API not configured', 503, 'SERVICE_NOT_CONFIGURED');
    }

    // Fetch current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    if (!currentRes.ok) {
      throw new AppError('Failed to fetch weather data', 502, 'WEATHER_API_ERROR');
    }
    const currentData: any = await currentRes.json();

    // Fetch forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=${days * 8}&appid=${apiKey}`
    );
    if (!forecastRes.ok) {
      throw new AppError('Failed to fetch forecast data', 502, 'FORECAST_API_ERROR');
    }
    const forecastData: any = await forecastRes.json();

    // Process current weather
    const current: WeatherResponse['current'] = {
      temp: Math.round(currentData.main.temp * 10) / 10,
      humidity: currentData.main.humidity,
      wind_speed: Math.round(currentData.wind.speed * 3.6 * 10) / 10,
      condition: translateCondition(currentData.weather[0].description, 'hi'),
      icon: currentData.weather[0].icon,
      feels_like: Math.round(currentData.main.feels_like * 10) / 10,
    };

    // Process forecast - group by date
    const forecastMap = new Map<string, any[]>();
    for (const item of forecastData.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!forecastMap.has(date)) {
        forecastMap.set(date, []);
      }
      forecastMap.get(date)!.push(item);
    }

    const forecast: ForecastDay[] = [];
    let totalRain = 0;
    let highRainAlert = false;

    for (const [date, items] of forecastMap) {
      const temps = items.map((i: any) => i.main.temp);
      const humidities = items.map((i: any) => i.main.humidity);
      const windSpeeds = items.map((i: any) => i.wind.speed);
      const rains = items.map((i: any) => (i.pop || 0) * 100);
      const maxRain = Math.max(...rains);

      if (maxRain > 40) {
        totalRain += maxRain;
      }
      if (maxRain > 80) {
        highRainAlert = true;
      }

      forecast.push({
        date,
        temp_max: Math.round(Math.max(...temps) * 10) / 10,
        temp_min: Math.round(Math.min(...temps) * 10) / 10,
        humidity: Math.round(Math.max(...humidities)),
        wind_speed: Math.round(Math.max(...windSpeeds) * 3.6 * 10) / 10,
        rain_probability: Math.round(maxRain),
        condition: translateCondition(items[0].weather[0].description, 'hi'),
        icon: items[0].weather[0].icon,
      });
    }

    // Generate alerts
    let alert: WeatherResponse['alert'] | undefined;
    if (totalRain > 150) {
      alert = {
        type: 'heavy_rain',
        message: `Agle 3 din mein ${Math.round(totalRain)}mm barish ka anumaan hai. Khet ki naali saaf rakhein aur paani jama na hone dein.`,
        severity: 'danger',
      };
    } else if (highRainAlert) {
      alert = {
        type: 'rain_warning',
        message: 'Aaj bhaari barish ki sambhavna hai. Chhidkaw na karein.',
        severity: 'warning',
      };
    }

    // Spray advisory
    const sprayAdvisory: WeatherResponse['sprayAdvisory'] = {
      safe: true,
    };

    if (current.wind_speed > 15) {
      sprayAdvisory.safe = false;
      sprayAdvisory.reason = `Hawai ki raftaar ${current.wind_speed} km/h hai — 15 km/h se zyada hai, chhidkaw se dawai urad sakti hai.`;
    } else if (forecast[0]?.rain_probability && forecast[0].rain_probability > 40) {
      sprayAdvisory.safe = false;
      sprayAdvisory.reason = `Barish ki sambhavna ${forecast[0].rain_probability}% hai. Chhidkaw ke baad dawai beh sakti hai.`;
    } else if (current.temp > 35) {
      sprayAdvisory.safe = false;
      sprayAdvisory.reason = `Tapman ${current.temp}°C hai — 35°C se upar, dawai jal sakti hai fasal ko.`;
    } else if (current.humidity < 40) {
      sprayAdvisory.safe = false;
      sprayAdvisory.reason = `Nami ${current.humidity}% hai — 40% se kam, dawai asar nahi karegi.`;
    } else {
      sprayAdvisory.idealWindow = 'Subah 6-9 baje, jab hawai 15 km/h se kam ho aur nami 60-80% ho.';
    }

    const response: WeatherResponse = { current, forecast, alert, sprayAdvisory };
    res.json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Weather API error', { error });
    throw new AppError('Failed to fetch weather data', 502, 'WEATHER_SERVICE_ERROR');
  }
});

function translateCondition(condition: string, lang: string): string {
  const translations: Record<string, Record<string, string>> = {
    hi: {
      'clear sky': 'saaf aasmaan',
      'few clouds': 'halke baadal',
      'scattered clouds': 'chitrite baadal',
      'broken clouds': 'khule baadal',
      'overcast clouds': 'ghaate baadal',
      'light rain': 'halki barish',
      'moderate rain': 'madhyam barish',
      'heavy rain': 'bhaari barish',
      'thunderstorm': 'aandhi-tufaan',
      'drizzle': 'phuaar',
      'mist': 'kohra',
      'fog': 'ghana kohra',
      'haze': 'dhuan',
      'smoke': 'dhuwan',
    },
    en: {},
  };

  const dict = translations[lang] || translations.en;
  if (dict[condition.toLowerCase()]) {
    return dict[condition.toLowerCase()];
  }

  const prefixMap: Record<string, string> = {
    'light ': 'halki ',
    'heavy ': 'bhaari ',
    'moderate ': 'madhyam ',
  };
  let cleaned = condition;
  for (const [prefix, replacement] of Object.entries(prefixMap)) {
    if (cleaned.toLowerCase().startsWith(prefix)) {
      cleaned = replacement + cleaned.slice(prefix.length);
      break;
    }
  }
  cleaned = cleaned.replace(/^sky is /i, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || condition;
}

export default router;

/**
 * Plain-text quick spray/irrigation advisory for the chat fallback path
 * (services/claude.ts). Uses the SAME live OpenWeatherMap call as the
 * /api/weather endpoint — no separate hardcoded forecast text. If we
 * don't have a location or API key, it says so honestly instead of
 * inventing a 3-day forecast.
 */
export async function getQuickSprayAdvisory(lat?: number | null, lon?: number | null): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return 'Mausam ki live jaankari abhi configure nahi hai (OPENWEATHER_API_KEY missing). Kripya apne block ke krishi vigyan kendra se sampark karein.';
  }
  if (lat == null || lon == null) {
    return 'Mausam ki sahi jaankari ke liye mujhe aapka location chahiye. Kya aap apna gaon/jila bata sakte hain, ya app mein location share karein?';
  }

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    if (!currentRes.ok) {
      return 'Mausam data abhi nahi mil paya. Kripya thodi der baad try karein.';
    }
    const data: any = await currentRes.json();
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const windKmh = Math.round(data.wind.speed * 3.6);

    let advisory: string;
    if (windKmh > 15) {
      advisory = `Hawa ki raftaar ${windKmh} km/h hai — zyada hai. Aaj chhidkav na karein, dawai urad jayegi.`;
    } else if (temp > 35) {
      advisory = `Tapman ${temp}°C hai — zyada garmi mein dawai fasal ko jala sakti hai. Subah jaldi ya shaam ko try karein.`;
    } else if (humidity < 40) {
      advisory = `Nami ${humidity}% hai — kam hai. Dawai ka asar kam ho sakta hai.`;
    } else {
      advisory = `Abhi ke mausam (${temp}°C, hawa ${windKmh} km/h, nami ${humidity}%) mein chhidkav surakshit lag raha hai. Subah 6-9 baje sabse behtar samay hai.`;
    }
    return `🌤️ Abhi ka mausam: ${temp}°C, nami ${humidity}%, hawa ${windKmh} km/h.\n\n💡 ${advisory}`;
  } catch (err) {
    logger.warn('getQuickSprayAdvisory failed', { error: err });
    return 'Mausam data abhi load nahi ho paya. Kripya dubara try karein.';
  }
}
