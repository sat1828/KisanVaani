import axios, { AxiosError } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const data = error.response.data as any;
      const message = data?.error || data?.message || 'An error occurred';
      return Promise.reject(new Error(message));
    }
    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    return Promise.reject(new Error('An unexpected error occurred'));
  }
);

export interface ChatRequest {
  message: string;
  language?: string;
  phoneNumber?: string;
  farmerName?: string;
  imageUrl?: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  diagnosis?: string | null;
  confidence?: number | null;
  treatment?: string | null;
  language: string;
  latencyMs: number;
  sessionId?: string;
  /** True when the real AI service was unreachable and the answer came
   *  from the offline rule-based/database fallback instead — surfaced so
   *  the UI can be honest about confidence rather than presenting a
   *  fallback answer with the same authority as a live AI diagnosis. */
  degraded?: boolean;
  weatherData?: any;
  marketData?: any;
}

export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    condition: string;
    icon: string;
    feels_like: number;
  };
  forecast: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    humidity: number;
    wind_speed: number;
    rain_probability: number;
    condition: string;
    icon: string;
  }>;
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

export interface MarketPrice {
  commodity: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  trend: string;
  /** 'unknown' appears when there's no prior price history yet for this
   *  commodity/market pair to compare against — the backend reports this
   *  honestly instead of guessing a direction (see backend's
   *  computeTrendDirection). The frontend type previously didn't include
   *  this value even though the backend could return it. */
  trendDirection: 'up' | 'down' | 'stable' | 'unknown';
}

export interface MarketResponse {
  prices: MarketPrice[];
  summary?: string;
}

// Chat with the AI advisor
export async function sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/chat', data);
  return response.data;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Uploads a farmer-submitted photo (crop/disease image) to the backend
 * and returns a public URL that can be passed as `imageUrl` to
 * sendChatMessage(). Without this, there was no way for a user to ever
 * attach a photo — the backend's vision pipeline existed with no entry
 * point feeding it.
 */
export async function uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return response.data;
}

// Get weather data
export async function getWeather(lat: number, lon: number, days: number = 3): Promise<WeatherData> {
  const response = await api.get<WeatherData>('/weather', {
    params: { lat, lon, days },
  });
  return response.data;
}

// Get market prices
export async function getMarketPrices(params?: {
  commodity?: string;
  state?: string;
  district?: string;
}): Promise<MarketResponse> {
  const response = await api.get<MarketResponse>('/market', { params });
  return response.data;
}

// Get list of commodities
export async function getCommodities(): Promise<string[]> {
  const response = await api.get<{ commodities: string[] }>('/market/commodities');
  return response.data.commodities;
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
}

export default api;
