import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import api from '../utils/api';
import { HiOutlineMail, HiOutlinePhone, HiOutlineClock, HiOutlineShieldCheck, HiOutlineExclamation } from 'react-icons/hi';

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function Contact() {
  const [formData, setFormData] = useState<FormState>({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Previously this just called setSubmitted(true) after a timer and
      // never sent the message anywhere — a fake success state. This now
      // hits the real backend (see backend/src/api/contact.ts), which
      // persists the message to the database and, if configured,
      // notifies a real inbox via email.
      await api.post('/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again or call the helpline below.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Header */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest glass text-primary-700 dark:text-primary-300 border border-primary-500/20 mb-4">
              Get in Touch
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              We&apos;re Here to{' '}
              <span className="text-gradient dark:text-gradient-dark">Help</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have a question about Krishak Mitra? Want to partner with us? Need help deploying in your region?
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  {/*
                    NOTE: only listing contact channels that are actually
                    wired up in this codebase. The previous version listed
                    an email address, a personal WhatsApp number, and a
                    "New Delhi office" with no backing infrastructure
                    anywhere in the code — fabricated trust signals. The
                    Kisan Call Centre number below IS real and
                    independently verified (government-run national
                    helpline, see https://www.manage.gov.in/kcc/kcc.asp).
                    Add your own real email/WhatsApp/office here once they
                    exist, and wire them into backend/src/api/contact.ts's
                    CONTACT_NOTIFY_EMAIL.
                  */}
                  {[
                    { icon: HiOutlinePhone, label: 'Kisan Call Centre (Govt. of India)', value: '1800-180-1551 (Toll Free, 22 languages)' },
                    { icon: HiOutlineClock, label: 'KCC Hours', value: '6 AM – 10 PM, all 7 days' },
                    { icon: HiOutlineMail, label: 'Form below', value: 'Saved securely and reviewed by our team' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Emergency Resources
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="text-sm font-medium text-red-700 dark:text-red-400">
                      Kisan Helpline (India)
                    </div>
                    <a href="tel:18001801551" className="text-lg font-bold text-red-600 dark:text-red-300 hover:underline">
                      1800-180-1551
                    </a>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      In a mental health crisis?
                    </div>
                    <a href="tel:14416" className="text-lg font-bold text-amber-600 dark:text-amber-300 hover:underline block">
                      Tele MANAS: 14416
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      24/7, free, government-run national mental health helpline.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                    <div className="text-sm font-medium text-primary-700 dark:text-primary-400">
                      Nearest Krishi Kendra
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Contact your block-level agriculture office for in-person advisory.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineShieldCheck className="w-5 h-5 text-primary-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Security & Privacy
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Messages submitted here are stored securely in our database and reviewed by our team.
                  We do not sell or share your data with third parties.
                </p>
              </GlassCard>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Send us a Message
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  We&apos;ll review your message and follow up by email.
                </p>

                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <HiOutlineMail className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Message Received
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Thank you for reaching out. We&apos;ll get back to you soon.
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {status === 'error' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                        <HiOutlineExclamation className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          minLength={1}
                          maxLength={100}
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl glass text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl glass text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        maxLength={20}
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl glass text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                        placeholder="+91-XXXXXXXXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Message
                      </label>
                      <textarea
                        required
                        minLength={10}
                        maxLength={2000}
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl glass text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all resize-none"
                        placeholder="How can we help you? (at least 10 characters)"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
