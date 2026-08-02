'use client';

import { motion } from 'framer-motion';

/** Fades + slides a section up into place the first time it scrolls into
 * view. Kept as its own tiny client component so the pages that use it
 * (home, product listing, etc.) can stay server components and just wrap
 * already-fetched content with this — no need to convert the whole page
 * to a client component. */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
