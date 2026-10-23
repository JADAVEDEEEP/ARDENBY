'use client';

import type { ReactNode } from 'react';

import { motion } from 'framer-motion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** One-time fade + translateY(30px) reveal on scroll (0.6s). Transforms are skipped for reduced motion
 *  via the MotionConfig wrapper on the homepage. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
