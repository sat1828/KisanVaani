import { Link } from 'react-router-dom';
import { HiOutlineHeart } from 'react-icons/hi';
import { RiLeafLine } from 'react-icons/ri';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-500/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <RiLeafLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  Krishak Mitra
                </span>
                <span className="ml-2 text-xs font-medium text-gray-500 uppercase tracking-wider">KisanVaani</span>
              </div>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md">
              Democratizing agricultural knowledge for smallholder farmers everywhere.
              AI-powered advisory in 12+ languages — available 24/7 on a basic phone.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/demo', label: 'Live Demo' },
                { to: '/features', label: 'Features' },
                { to: '/about', label: 'About Us' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/contact', label: 'Contact' },
                { to: '/contact', label: 'Report Issue' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="tel:18001801551"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Kisan Helpline: 1800-180-1551
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; {currentYear} Krishak Mitra (KisanVaani). All rights reserved.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              Built with <HiOutlineHeart className="w-3 h-3 text-red-500" /> for every farmer
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
