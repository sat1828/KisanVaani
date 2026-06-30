import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHome } from 'react-icons/hi';
import { RiLeafLine } from 'react-icons/ri';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <RiLeafLine className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          This page doesn&apos;t exist — let&apos;s get you back on track.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-200"
        >
          <HiOutlineHome className="w-5 h-5" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
