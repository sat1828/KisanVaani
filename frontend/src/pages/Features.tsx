import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import {
  HiOutlineSearch,
  HiOutlineCloud,
  HiOutlineCurrencyRupee,
  HiOutlineGlobe,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineMicrophone,
  HiOutlineChat,
  HiOutlinePhotograph,
  HiOutlineBell,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
} from 'react-icons/hi';
import { LuSprout } from 'react-icons/lu';

const featureCategories = [
  {
    title: 'Core Intelligence',
    features: [
      {
        icon: HiOutlineSearch,
        title: 'Crop Disease & Pest ID',
        description: 'Identify diseases for rice, wheat, cotton, maize, tomato, and banana from a verified database, plus broader AI reasoning via Claude for symptoms outside it. Voice or photo input. Treatment plans with cost estimates.',
      },
      {
        icon: LuSprout,
        title: 'Nutrient Deficiency Diagnosis',
        description: 'AI-assisted diagnosis of NPK, zinc, iron, calcium, and sulfur deficiencies based on described or photographed symptoms, with dosage recommendations for organic and chemical fertilizers.',
      },
      {
        icon: HiOutlineChartBar,
        title: 'Market Price Intelligence',
        description: 'Mandi prices sourced from the government AGMARKNET API where available, with 7-day historical trend tracking and a sell/hold-style recommendation. Falls back to clearly-labeled illustrative data if the live API is unavailable.',
      },
      {
        icon: HiOutlineCloud,
        title: 'Weather-Integrated Advisory',
        description: 'Hyperlocal 7-day forecast. Real-time spray advisories based on wind, humidity, temperature, and rain probability. Flood and disease surge alerts.',
      },
    ],
  },
  {
    title: 'Accessibility',
    features: [
      {
        icon: HiOutlineMicrophone,
        title: 'Voice-First Design',
        description: 'Every interaction works with voice. Short sentences (max 15 words), no visual-only content. Numbers are spoken as words. Local metaphors replace technical jargon.',
      },
      {
        icon: HiOutlineGlobe,
        title: '12+ Regional Languages',
        description: 'Hindi, Telugu, Kannada, Marathi, Punjabi, Odia, Tamil, Swahili, Amharic, Hausa, Bahasa Indonesia, and English. Dialect-aware with regional vocabulary calibration.',
      },
      {
        icon: HiOutlinePhone,
        title: 'Works on Basic Phones',
        description: 'IVR (Interactive Voice Response) via toll-free number. No smartphone, no internet, no app required. SMS fallback for critical alerts.',
      },
      {
        icon: HiOutlineChat,
        title: 'WhatsApp Integration',
        description: 'Send voice notes, photos, or text via WhatsApp. Get replies as text + voice. Quick-reply buttons for low-literacy users.',
      },
    ],
  },
  {
    title: 'Safety & Compliance',
    features: [
      {
        icon: HiOutlineShieldCheck,
        title: 'Banned Chemical Alert',
        description: 'Auto-checks against CIBRC banned list (Monocrotophos, Methyl Parathion, Endosulfan, etc.). Never recommends banned pesticides. Offers safer alternatives.',
      },
      {
        icon: HiOutlineBell,
        title: 'Proactive Weather Alerts',
        description: 'Auto-push alerts when 72-hour rainfall exceeds 150mm. Post-rain preventive fungicide windows. Mosquito-breeding and stagnant water warnings.',
      },
      {
        icon: HiOutlineUserGroup,
        title: 'Crisis Detection & Support',
        description: 'Screens for farmer distress language across multiple languages and responds with verified mental health helplines (Tele MANAS, KIRAN) and the Kisan Call Centre (1800-180-1551) instead of an agricultural answer. This is a safety layer, not a guarantee — it cannot catch every case.',
      },
      {
        icon: HiOutlineLockClosed,
        title: 'Privacy-First Architecture',
        description: 'Farmer data encrypted at rest and in transit. Phone numbers used only for advisory delivery. No data shared with third parties. GDPR and India DPDP compliant.',
      },
    ],
  },
  {
    title: 'Technical Excellence',
    features: [
      {
        icon: HiOutlineLightningBolt,
        title: 'Fast Response',
        description: 'The AI pipeline is built for speed — typical responses return in a few seconds, since crop disease can progress significantly within 48 hours.',
      },
      {
        icon: HiOutlinePhotograph,
        title: 'AI Vision Integration',
        description: 'Upload crop photos for visual analysis via Claude\'s vision model, cross-referenced against the verified symptom database where a match exists. We don\'t publish an accuracy percentage until it\'s been measured against real, agronomist-reviewed outcomes.',
      },
      {
        icon: HiOutlineChat,
        title: 'Contextual Memory',
        description: 'Remembers recent messages within a conversation session, so follow-up questions don\'t require repeating context. Long-term memory across separate visits (e.g. greeting a returning farmer by name) is on the roadmap, not yet built.',
      },
      {
        icon: HiOutlineUserGroup,
        title: 'Escalation Path',
        description: 'The AI handles agricultural queries directly. For situations it can\'t resolve, it points farmers toward their nearest dealer or Krishi Vigyan Kendra; for crisis language, it follows the dedicated mental-health escalation protocol instead.',
      },
    ],
  },
];

export default function Features() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Header */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest glass text-primary-700 dark:text-primary-300 border border-primary-500/20 mb-4">
              Platform Features
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Everything a Farmer{' '}
              <span className="text-gradient dark:text-gradient-dark">Needs</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built for smallholder farmers everywhere who deserve access to expert agricultural knowledge.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, catIndex) => (
        <section key={category.title} className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                Category {catIndex + 1}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {category.title}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.features.map((feature, i) => (
                <GlassCard key={feature.title} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Stats Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '6', label: 'Crops in Database' },
              { value: '12+', label: 'Languages (via Claude AI)' },
              { value: 'Live', label: 'AGMARKNET Pricing' },
              { value: '7-day', label: 'Price Trend Window' },
              { value: '3', label: 'Crisis Helplines Wired In' },
              { value: '<5s', label: 'Typical Response Time' },
              { value: '24/7', label: 'Availability' },
              { value: '3', label: 'Input Channels' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass-card text-center"
              >
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
