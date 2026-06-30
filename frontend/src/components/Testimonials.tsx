import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

/**
 * IMPORTANT: these are illustrative example scenarios, NOT real customer
 * testimonials. The previous version of this component invented named
 * "farmers" (with specific villages, crops, and quotes) and displayed
 * them under a "Trusted by Thousands" heading — fabricated social proof
 * with zero real users behind it anywhere in this codebase.
 *
 * This version is explicit that these are hypothetical usage scenarios
 * illustrating what the product is designed to do. Replace this entire
 * array with real testimonials (with consent) once you have actual
 * users — do not quietly drop the "Example scenario" framing when you
 * do, since at that point you'd want a different, verifiably-real
 * component anyway (e.g. with photos/dates/verifiable details).
 */
const scenarios = [
  {
    quote: 'A rice farmer notices sheath blight symptoms and sends a photo. Krishak Mitra identifies the disease and recommends an organic treatment, potentially saving the harvest within days.',
    persona: 'Example: Rice farmer, North India',
    crop: 'Rice',
  },
  {
    quote: 'A maize farmer suspects Fall Armyworm damage. A text description gets a same-session diagnosis and a low-cost organic-first treatment option before resorting to chemical sprays.',
    persona: 'Example: Maize farmer, East Africa',
    crop: 'Maize',
  },
  {
    quote: 'Instead of traveling to the mandi to check prices, a vegetable farmer asks Krishak Mitra directly and times their tomato sale around a real price trend.',
    persona: 'Example: Vegetable farmer, Western India',
    crop: 'Vegetables',
  },
  {
    quote: 'A wheat farmer checks the spray advisory before applying pesticide and avoids spraying on a high-wind day, preventing the chemical from drifting off target.',
    persona: 'Example: Wheat farmer, Punjab',
    crop: 'Wheat',
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % scenarios.length);
  const prev = () => setCurrent((prev) => (prev - 1 + scenarios.length) % scenarios.length);

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
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
            Example Scenarios
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
            What Krishak Mitra Is{' '}
            <span className="text-gradient dark:text-gradient-dark">Built For</span>
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
            These are illustrative usage scenarios, not customer testimonials — try the live demo above to see it for yourself.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <GlassCard className="text-center">
                  <blockquote className="text-lg sm:text-xl text-gray-700 dark:text-gray-200 leading-relaxed mb-8">
                    {scenarios[current].quote}
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {scenarios[current].persona}
                    </div>
                    <div className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">
                      {scenarios[current].crop}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="p-3 rounded-xl glass hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 text-gray-600 dark:text-gray-300"
              aria-label="Previous"
            >
              <HiOutlineChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {scenarios.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? 'bg-primary-500 w-6'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`Go to scenario ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-3 rounded-xl glass hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 text-gray-600 dark:text-gray-300"
              aria-label="Next"
            >
              <HiOutlineChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
