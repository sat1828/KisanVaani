import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Particles3D from './Particles3D';
import { useTheme } from '../hooks/useTheme';
import { HiOutlinePlay, HiOutlineInformationCircle } from 'react-icons/hi';

export default function Hero() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 ${isDark ? 'bg-hero-pattern-dark' : 'bg-hero-pattern'} opacity-60`} />
        <div className="absolute top-0 -left-40 w-96 h-96 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      {/* 3D Particles */}
      <Particles3D />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest glass text-primary-700 dark:text-primary-300 border border-primary-500/20 mb-6">
              v2.1 — Production Grade
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="text-gray-900 dark:text-white">Your Personal</span>{' '}
            <span className="text-gradient dark:text-gradient-dark">Agri-Advisor</span>
            <br />
            <span className="text-gray-900 dark:text-white">In Every Language</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed"
          >
            AI-powered crop disease diagnosis, weather advisory, and market intelligence —
            available 24/7 on a basic phone in{' '}
            <span className="font-semibold text-primary-600 dark:text-primary-400">12+ languages</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-600 transition-all duration-200 text-lg gap-2"
            >
              <HiOutlinePlay className="w-5 h-5" />
              Try Live Demo
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl glass text-gray-700 dark:text-gray-200 font-semibold hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 text-lg gap-2"
            >
              <HiOutlineInformationCircle className="w-5 h-5" />
              Learn More
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: '12+', label: 'Languages (via Claude AI)' },
              { value: '6', label: 'Crops in Verified Database' },
              { value: '<5s', label: 'Typical Response Time' },
              { value: '24/7', label: 'Availability' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex justify-center p-1">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-primary-500"
          />
        </div>
      </motion.div>
    </section>
  );
}
