import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { HiOutlineSun, HiOutlineMoon, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { RiLeafLine } from 'react-icons/ri';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/features', label: 'Features' },
  { path: '/demo', label: 'Live Demo' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass-strong shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 transition-shadow duration-300">
              <RiLeafLine className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Krishak Mitra
              </span>
              <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                KisanVaani
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl glass hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 text-gray-600 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'light' ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineMoon className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineSun className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <Link
              to="/demo"
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-600 transition-all duration-200"
            >
              Try Demo
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2.5 rounded-xl glass hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 text-gray-600 dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <HiOutlineX className="w-5 h-5" />
              ) : (
                <HiOutlineMenu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass-strong border-t border-white/10 dark:border-white/5"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/demo"
                className="block px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold text-center mt-3"
              >
                Try Demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
