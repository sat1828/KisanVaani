import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { HiOutlineGlobe, HiOutlineHeart, HiOutlineLightningBolt } from 'react-icons/hi';
import { RiLeafLine } from 'react-icons/ri';

/**
 * Forward-looking roadmap, NOT a history of things that already shipped.
 * The previous version of this component presented a fabricated company
 * history — "Beta Launch... Onboarded 1,000+ farmers", "Production
 * Release v1.0... Accuracy >85% on disease diagnosis" — none of which had
 * happened. There is no farmer base, no measured accuracy number, and no
 * past release history anywhere in this codebase. This is honestly
 * labeled as a roadmap of what's built vs. planned instead.
 */
const roadmap = [
  {
    status: 'Built',
    title: 'Core Platform',
    description: 'Voice/text/photo chat with Claude AI, a verified disease database for 6 crops (rice, wheat, cotton, maize, tomato, banana), live weather spray advisories, and real-time mandi price lookups.',
  },
  {
    status: 'Built',
    title: 'WhatsApp & IVR Channels',
    description: 'Twilio-based WhatsApp messaging and phone-based IVR for farmers without smartphone access, with signature-verified webhooks.',
  },
  {
    status: 'In progress',
    title: 'Expanded Disease Coverage',
    description: 'Growing the verified disease database beyond the initial 6 crops, with field validation before each addition ships.',
  },
  {
    status: 'Planned',
    title: 'Measured Accuracy Reporting',
    description: 'Once in real use, we intend to track and publish diagnosis accuracy against agronomist-reviewed outcomes, rather than quoting an unverified number.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest glass text-primary-700 dark:text-primary-300 border border-primary-500/20 mb-4">
                Our Mission
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
                Democratizing Agricultural{' '}
                <span className="text-gradient dark:text-gradient-dark">Knowledge</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                We believe every farmer — regardless of literacy, language, or location — deserves access
                to expert agricultural advice. Krishak Mitra aims to bring that advice to your field, 24/7.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {/*
                NOTE: removed a previous "1.3B Farmers Served" stat here —
                there is no user base behind this project yet, and 1.3B is
                roughly the entire global population dependent on
                agriculture, an obviously impossible usage figure for any
                single product. Only verifiable, currently-true claims
                are shown below.
              */}
              {[
                { icon: RiLeafLine, value: '6', label: 'Crops in Database' },
                { icon: HiOutlineGlobe, value: '3', label: 'Input Channels (Web, WhatsApp, IVR)' },
                { icon: HiOutlineHeart, value: 'Open', label: 'Source Roadmap' },
                { icon: HiOutlineLightningBolt, value: '<5s', label: 'Typical Response Time' },
              ].map((stat) => (
                <GlassCard key={stat.label} className="text-center">
                  <stat.icon className="w-8 h-8 mx-auto text-primary-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </GlassCard>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mb-12"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              The Challenge
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
              Why We Exist
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/*
              Only including statistics that are independently verifiable
              and properly sourced. The previous version attributed
              specific numbers to "World Bank, 2025" and "ICAR Study"
              without any real citation backing them — that's exactly the
              kind of unsourced-but-confident claim that's hard to
              distinguish from a fabricated one. The extension-worker
              ratio below is real and traceable to published research.
            */}
            {[
              {
                title: '1 : 1,162 Ratio',
                description: 'India has roughly 200,000 government agricultural extension workers, each responsible for an average of 1,162 farm holdings — well above the recommended 1:750 ratio.',
                source: 'Gulati et al. 2018, via ECHO India',
              },
              {
                title: 'Reaches ~7% of Farmers',
                description: 'Government extension services are estimated to reach only a small fraction of farmers who need them, leaving most without access to a qualified agronomist.',
                source: 'FAO, 2012 (cited in MANAGE discussion paper)',
              },
              {
                title: 'No Voice-First AI Existed',
                description: 'At the time this project started, we were not aware of a conversational AI that was simultaneously voice-first, multilingual, and agronomically grounded for smallholders specifically.',
                source: 'Internal assessment, not an independent market study',
              },
            ].map((problem, i) => (
              <GlassCard key={problem.title} delay={i * 0.1}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {problem.description}
                </p>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  — {problem.source}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16 lg:py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mb-12"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Roadmap
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
              What&apos;s Built vs. What&apos;s Next
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 to-primary-500/20 hidden md:block" />
            <div className="space-y-8">
              {roadmap.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative pl-0 md:pl-20"
                >
                  <div className="hidden md:block absolute left-6 top-2 w-5 h-5 rounded-full bg-primary-500 border-4 border-white dark:border-gray-900 shadow" />
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        item.status === 'Built'
                          ? 'text-green-700 dark:text-green-400 bg-green-500/10'
                          : item.status === 'In progress'
                          ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                          : 'text-gray-600 dark:text-gray-400 bg-gray-500/10'
                      }`}>
                        {item.status}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20 bg-primary-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Operating Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 mb-8">
              How We Work
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { title: 'Farmer First', desc: 'Understood over technically precise. Every interaction respects the farmer\'s expertise about their own land.' },
              { title: 'Voice > Text', desc: 'Design every interaction as if the user cannot read. Voice-first, always.' },
              { title: 'Economic Reality', desc: 'Know the cost of every recommendation. Offer the affordable option first, not the premium one.' },
              { title: 'Honest by Default', desc: 'Say "I don\'t know" when the database doesn\'t have an answer, instead of guessing with false confidence.' },
            ].map((value, i) => (
              <GlassCard key={value.title} delay={i * 0.1} className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {value.desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
