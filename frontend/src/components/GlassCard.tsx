import { ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  delay?: number;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', glow = false, hover = true, delay = 0 }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay }}
        className={`
          group relative overflow-hidden rounded-2xl p-6 sm:p-8
          glass
          ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
          ${glow ? 'hero-glow' : ''}
          transition-all duration-500
          ${className}
        `}
      >
        {/* Gradient border accent */}
        <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary-500/20 to-transparent opacity-50" />
        </div>

        {/* Shimmer overlay on hover */}
        {hover && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer-text pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
