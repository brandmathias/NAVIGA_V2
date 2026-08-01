'use client';

/**
 * PageTransition — route transition wrapper
 *
 * Wraps page content with framer-motion AnimatePresence for
 * smooth entrance/exit animations on navigation.
 *
 * Motion personality: Corporate
 *   Entrance: 280ms fade-up, decelerate easing
 *   Exit: 160ms fade-up, accelerate easing
 *
 * The transition intentionally avoids blur filters. A full-page blur promotes
 * a large composited layer on every route change and makes navigation feel
 * heavier on lower-powered devices.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  EASE_ENTRANCE,
  EASE_EXIT,
  DUR_PAGE,
  DUR_QUICK,
} from './variants';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: DUR_PAGE,
            ease: EASE_ENTRANCE,
          },
        }}
        exit={{
          opacity: 0,
          y: -4,
          transition: {
            duration: DUR_QUICK,
            ease: EASE_EXIT,
          },
        }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
