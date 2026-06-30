import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { getMarketPrices, getCommodities, MarketPrice } from '../utils/api';
import { HiOutlineCurrencyRupee, HiOutlineSearch, HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineMinus } from 'react-icons/hi';

export default function MarketPrices() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getCommodities().then(setCommodities).catch(() => {});
    loadPrices();
  }, []);

  const loadPrices = async (commodity?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMarketPrices({ commodity });
      setPrices(data.prices);
    } catch (err: any) {
      setError(err.message || 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  const handleCommoditySelect = (commodity: string) => {
    const newCommodity = commodity === selectedCommodity ? '' : commodity;
    setSelectedCommodity(newCommodity);
    loadPrices(newCommodity || undefined);
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Market Prices
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            Mandi Bhav
          </div>
        </div>
        <HiOutlineCurrencyRupee className="w-8 h-8 text-primary-500" />
      </div>

      {/* Commodity search */}
      <div className="relative mb-4">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search commodity..."
          value={selectedCommodity}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedCommodity(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (value.length > 1) {
              debounceRef.current = setTimeout(() => loadPrices(value), 400);
            }
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
        />
      </div>

      {/* Quick filter chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {commodities.slice(0, 8).map((c) => (
          <button
            key={c}
            onClick={() => handleCommoditySelect(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCommodity === c
                ? 'bg-primary-500 text-white'
                : 'glass text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          {error}
        </div>
      ) : prices.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No market data available. Try searching for a commodity above.
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {prices.map((price, i) => (
            <motion.div
              key={`${price.commodity}-${price.market}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl glass hover:bg-white/20 dark:hover:bg-black/20 transition-all cursor-default"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {price.commodity}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {price.market}, {price.district}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  ₹{price.modalPrice}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {price.trendDirection === 'up' ? (
                    <HiOutlineTrendingUp className="w-3 h-3 text-green-500" />
                  ) : price.trendDirection === 'down' ? (
                    <HiOutlineTrendingDown className="w-3 h-3 text-red-500" />
                  ) : price.trendDirection === 'unknown' ? (
                    <HiOutlineMinus className="w-3 h-3 text-gray-400" />
                  ) : null}
                  <span className={
                    price.trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
                    price.trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'
                  }>
                    /{price.unit}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
