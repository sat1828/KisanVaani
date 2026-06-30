import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { getWeather, WeatherData } from '../utils/api';
import { HiOutlineCloud, HiOutlineSun } from 'react-icons/hi';
import { IoWaterOutline } from 'react-icons/io5';
import { RiWindyLine } from 'react-icons/ri';

interface WeatherWidgetProps {
  lat?: number;
  lon?: number;
}

export default function WeatherWidget({ lat = 28.6139, lon = 77.209 }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWeather(lat, lon);
        setWeather(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [lat, lon]);

  if (loading) {
    return (
      <GlassCard>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </GlassCard>
    );
  }

  if (error || !weather) {
    return (
      <GlassCard>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Weather data unavailable. Try again later.
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Current Weather
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {weather.current.temp}°C
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
            {weather.current.condition}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">Feels like</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {weather.current.feels_like}°C
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <IoWaterOutline className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {weather.current.humidity}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
        </div>
        <div className="text-center">
          <RiWindyLine className="w-5 h-5 mx-auto text-teal-500 mb-1" />
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {weather.current.wind_speed} km/h
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Wind</div>
        </div>
        <div className="text-center">
          <HiOutlineSun className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {weather.forecast[0]?.rain_probability || 0}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Rain</div>
        </div>
      </div>

      {/* Spray advisory */}
      {weather.sprayAdvisory && (
        <div className={`p-3 rounded-xl text-sm ${
          weather.sprayAdvisory.safe
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
        }`}>
          <div className="font-medium mb-1">
            {weather.sprayAdvisory.safe ? '✅ Spraying Recommended' : '⚠️ Spraying Not Recommended'}
          </div>
          <div className="text-xs">
            {weather.sprayAdvisory.reason || weather.sprayAdvisory.idealWindow}
          </div>
        </div>
      )}

      {/* Alert */}
      {weather.alert && (
        <div className={`mt-3 p-3 rounded-xl text-sm ${
          weather.alert.severity === 'danger'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
        }`}>
          <div className="font-medium mb-1">🚨 {weather.alert.type === 'heavy_rain' ? 'Heavy Rain Alert' : 'Weather Alert'}</div>
          <div className="text-xs">{weather.alert.message}</div>
        </div>
      )}

      {/* Forecast */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          3-Day Forecast
        </div>
        <div className="grid grid-cols-3 gap-2">
          {weather.forecast.slice(0, 3).map((day, i) => (
            <div key={day.date} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {Math.round((day.temp_max + day.temp_min) / 2)}°
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {day.rain_probability}% rain
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
