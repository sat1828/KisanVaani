import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import DemoChat, { DemoChatHandle } from '../components/DemoChat';
import WeatherWidget from '../components/WeatherWidget';
import MarketPrices from '../components/MarketPrices';
import { HiOutlineChatAlt2, HiOutlineCloud, HiOutlineCurrencyRupee } from 'react-icons/hi';

type Tab = 'chat' | 'weather' | 'market';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'chat', label: 'AI Chat', icon: HiOutlineChatAlt2 },
  { id: 'weather', label: 'Weather', icon: HiOutlineCloud },
  { id: 'market', label: 'Market', icon: HiOutlineCurrencyRupee },
];

const defaultLocations = [
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
];

const defaultCommodities = [
  'Rice', 'Wheat', 'Cotton', 'Maize', 'Tomato', 'Potato', 'Onion', 'Soybean',
];

export default function Demo() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [selectedLocation, setSelectedLocation] = useState(defaultLocations[0]);
  const demoChatRef = useRef<DemoChatHandle>(null);

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest glass text-primary-700 dark:text-primary-300 border border-primary-500/20 mb-4">
            Live Demo
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
            Experience{' '}
            <span className="text-gradient dark:text-gradient-dark">Krishak Mitra</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Interact with the AI advisor. Diagnose crop problems, check weather, and explore market prices.
          </p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex gap-2 p-1 glass rounded-2xl inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2">
            {activeTab === 'chat' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard className="p-0 overflow-hidden">
                  <DemoChat ref={demoChatRef} />
                </GlassCard>
              </motion.div>
            )}

            {activeTab === 'weather' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Location selector */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {defaultLocations.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => setSelectedLocation(loc)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedLocation.name === loc.name
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                          : 'glass text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                  <span className="px-4 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 italic">
                    (Select location for weather)
                  </span>
                </div>
                <WeatherWidget lat={selectedLocation.lat} lon={selectedLocation.lon} />
              </motion.div>
            )}

            {activeTab === 'market' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MarketPrices />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Info */}
              <GlassCard>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  About This Demo
                </h3>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>Chat with AI in Hindi or English</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>Get crop disease diagnosis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>Check live weather & spray advisory</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>View mandi prices</span>
                  </li>
                </ul>
              </GlassCard>

              {/* Try Saying */}
              <GlassCard>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Try Saying...
                </h3>
                <div className="space-y-2">
                  {[
                    'Mere dhan ke patte pe kaale dhabbe hain',
                    'Aaj chhidkav kar sakte hain?',
                    'Gehun ka bhav kya hai?',
                    'Tomato ke patte murajha rahe hain',
                  ].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveTab('chat');
                        demoChatRef.current?.setInputText(text);
                      }}
                      className="block w-full text-left px-4 py-2.5 rounded-xl glass text-sm text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                    >
                      &ldquo;{text}&rdquo;
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Weather Quick View */}
              <WeatherWidget />

              {/* Quick Market */}
              <GlassCard>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Top Commodities
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {defaultCommodities.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveTab('market')}
                      className="px-3 py-1.5 rounded-lg glass text-xs text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
