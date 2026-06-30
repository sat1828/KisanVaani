import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { HiOutlineMicrophone, HiOutlineChip, HiOutlineReply, HiOutlineLightningBolt } from 'react-icons/hi';

const steps = [
  {
    icon: HiOutlineMicrophone,
    number: '01',
    title: 'Speak Your Problem',
    description: 'Call or message in your language — describe what you see in your crop. No app needed.',
    gradient: 'from-primary-500 to-emerald-500',
  },
  {
    icon: HiOutlineChip,
    number: '02',
    title: 'AI Analyzes Instantly',
    description: 'Our engine cross-references symptoms against a verified disease database plus Claude AI, factoring in season and weather.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: HiOutlineLightningBolt,
    number: '03',
    title: 'Get Precise Answer',
    description: 'Diagnosis, treatment, dosage, and cost — all in simple words you already understand.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: HiOutlineReply,
    number: '04',
    title: 'Ask Follow-Up Questions',
    description: 'Continue the same conversation — the AI remembers what you\'ve already told it within that session, so you don\'t have to repeat yourself.',
    gradient: 'from-rose-500 to-pink-500',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest glass text-primary-700 dark:text-primary-300 border border-primary-500/20 mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
            Three Steps to{' '}
            <span className="text-gradient dark:text-gradient-dark">Save Your Crop</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            No literacy required. No smartphone needed. Just describe what you see.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <GlassCard key={step.number} delay={index * 0.15}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-200 dark:text-gray-800 select-none">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
