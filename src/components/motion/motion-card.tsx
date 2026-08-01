'use client';

/**
 * MotionCard — animated Card wrapper
 *
 * Adds hover-lift and scroll-reveal to shadcn Card components.
 *
 * Motion layers:
 *   Primary — scroll-triggered entrance (fade up + slight scale)
 *   Secondary — shadow arrival 50ms after card lands
 *   Ambient — subtle hover lift with shadow expansion
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { EASE_ENTRANCE, DUR_STANDARD } from './variants';
import { cn } from '@/lib/utils';

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  disableHover?: boolean;
}

export function MotionCard({
  children,
  className,
  delay = 0,
  disableHover = false,
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: DUR_STANDARD,
          ease: EASE_ENTRANCE,
          delay,
        },
      }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={
        disableHover
          ? undefined
          : {
              y: -3,
              scale: 1.005,
              boxShadow: '0 16px 40px rgba(10, 79, 89, 0.10), 0 2px 8px rgba(10, 79, 89, 0.06)',
              transition: {
                duration: 0.22,
                ease: EASE_ENTRANCE,
              },
            }
      }
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
