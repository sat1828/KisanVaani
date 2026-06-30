import Hero from '../components/Hero';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { HiOutlinePlay, HiOutlineGlobe, HiOutlinePhone } from 'react-icons/hi';

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturesSection />
      <HowItWorks />

      {/* Channels Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
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
              Omni-Channel Access
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Available on{' '}
              <span className="text-gradient dark:text-gradient-dark">Every Channel</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              No smartphone? No internet? No problem. We reach farmers where they are.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: HiOutlineGlobe,
                title: 'WhatsApp',
                description: 'Send voice notes, photos, or text. Get replies with diagnosis and treatment.',
                action: 'Chat on WhatsApp',
                gradient: 'from-green-500 to-emerald-600',
                // Set VITE_WHATSAPP_NUMBER in frontend/.env to your real
                // Twilio WhatsApp sender number once configured. Falls
                // back to a placeholder that's visibly a placeholder
                // rather than a dead, non-functional link.
                href: import.meta.env.VITE_WHATSAPP_NUMBER
                  ? `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`
                  : undefined,
              },
              {
                icon: HiOutlinePhone,
                title: 'IVR Voice Call',
                description: 'Dial toll-free number from any phone. Speak your problem in your language.',
                action: 'Call Now',
                gradient: 'from-violet-500 to-purple-600',
                highlight: 'Kisan Call Centre: 1800-180-1551',
                href: 'tel:18001801551',
              },
              {
                icon: HiOutlinePlay,
                title: 'Web Dashboard',
                description: 'Full-featured web interface with chat, weather, and market intelligence.',
                action: 'Try Web Demo',
                gradient: 'from-amber-500 to-orange-600',
                link: '/demo',
              },
            ].map((channel, i) => (
              <GlassCard key={channel.title} delay={i * 0.1}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${channel.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <channel.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {channel.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {channel.description}
                </p>
                {(channel as any).highlight && (
                  <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-3">
                    {(channel as any).highlight}
                  </div>
                )}
                {(channel as any).link ? (
                  <Link
                    to={(channel as any).link}
                    className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {channel.action} →
                  </Link>
                ) : (channel as any).href ? (
                  <a
                    href={(channel as any).href}
                    target={(channel as any).href.startsWith('tel:') ? undefined : '_blank'}
                    rel={(channel as any).href.startsWith('tel:') ? undefined : 'noopener noreferrer'}
                    className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {channel.action} →
                  </a>
                ) : (
                  <span
                    className="inline-flex items-center text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    title="WhatsApp number not yet configured (set VITE_WHATSAPP_NUMBER)"
                  >
                    Coming soon
                  </span>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 via-primary-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Ready to Transform Your{' '}
              <span className="text-gradient dark:text-gradient-dark">Farming?</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Try the live demo and see how AI-powered crop advice works.
              No signup required to try it out.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demo"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-600 transition-all duration-200 text-lg gap-2"
              >
                <HiOutlinePlay className="w-5 h-5" />
                Try Demo Now
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl glass text-gray-700 dark:text-gray-200 font-semibold hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 text-lg"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Testimonials />
    </div>
  );
}
