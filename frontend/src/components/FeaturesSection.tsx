import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { useTheme } from '../hooks/useTheme';
import {
  HiOutlineSearch,
  HiOutlineCloud,
  HiOutlineCurrencyRupee,
  HiOutlineGlobe,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineSun,
  HiOutlineLightningBolt,
} from 'react-icons/hi';
import { LuSprout } from 'react-icons/lu';

const features = [
  {
    icon: HiOutlineSearch,
    title: 'Disease & Pest ID',
    description: 'Identify common crop diseases with voice or photo, backed by a verified database. Get treatment plans in your language.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: HiOutlineCloud,
    title: 'Weather Intelligence',
    description: 'Live weather data with spray advisories. Know the best time to irrigate or apply inputs.',
    gradient: 'from-sky-500 to-blue-500',
  },
  {
    icon: HiOutlineCurrencyRupee,
    title: 'Market Prices',
    description: 'Mandi prices via the government AGMARKNET API, with real 7-day trend tracking and a sell/hold-style recommendation.',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: HiOutlineGlobe,
    title: '12+ Languages',
    description: 'Hindi, Swahili, Tamil, Telugu, English, and more via Claude AI. Voice-first for low-literacy users.',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    icon: HiOutlinePhone,
    title: 'Works on Basic Phones',
    description: 'No smartphone? No problem. Works via voice calls (IVR) on any phone, plus WhatsApp.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Safe & Banned-Free',
    description: 'The AI is instructed to never recommend banned pesticides (Monocrotophos, Methyl Parathion, Endosulfan, and others).',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: LuSprout,
    title: 'Nutrient Deficiency',
    description: 'AI-assisted diagnosis of NPK, zinc, and iron deficiencies with dosage recommendations.',
    gradient: 'from-lime-500 to-green-500',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Fast Response',
    description: 'Built for speed — typical responses return in a few seconds, since crop disease can progress fast.',
    gradient: 'from-orange-500 to-red-500',
  },
];

export default function FeaturesSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/80'}`} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 dark:bg-primary-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest glass text-primary-700 dark:text-primary-300 border border-primary-500/20 mb-4">
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
            Power of AI,{' '}
            <span className="text-gradient dark:text-gradient-dark">Simplicity of Voice</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            From diagnosis to market — one conversation covers your entire farming cycle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <GlassCard key={feature.title} delay={index * 0.1}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
