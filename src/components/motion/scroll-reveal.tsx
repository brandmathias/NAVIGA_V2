'use client';

/**
 * ScrollReveal — scroll-triggered reveal component
 *
 * Wraps any children and animates them into view when they enter the viewport.
 * Uses Intersection Observer via framer-motion's whileInView.
 *
 * Motion layers:
 *   Primary — the entrance animation (fade, slide, scale)
 *   Secondary — optional shadow/border that arrives 50ms after
 */

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  fadeUpVariants,
  fadeInVariants,
  scaleUpVariants,
  slideLeftVariants,
  slideRightVariants,
  EASE_ENTRANCE,
  DUR_STANDARD,
} from './variants';
import { cn } from '@/lib/utils';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  as?: keyof typeof motionElements;
}

const motionElements = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  span: motion.span,
} as const;

const directionVariants: Record<RevealDirection, Variants> = {
  up: fadeUpVariants,
  down: {
    hidden: { opacity: 0, y: -24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DUR_STANDARD,
        ease: EASE_ENTRANCE,
      },
    },
  },
  left: slideLeftVariants,
  right: slideRightVariants,
  fade: fadeInVariants,
  scale: scaleUpVariants,
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration,
  className,
  once = true,
  amount = 0.15,
  as = 'div',
}: ScrollRevealProps) {
  const MotionComponent = motionElements[as];
  const variants = directionVariants[direction];

  const customVariants: Variants = duration || delay
    ? {
        hidden: variants.hidden,
        visible: {
          ...(typeof variants.visible === 'object' && variants.visible ? (variants.visible as Record<string, unknown>) : {}),
          transition: {
            ...(typeof variants.visible === 'object' && variants.visible && 'transition' in variants.visible && typeof (variants.visible as Record<string, unknown>).transition === 'object'
              ? ((variants.visible as Record<string, unknown>).transition as Record<string, unknown>)
              : {}),
            ...(duration ? { duration } : {}),
            ...(delay ? { delay } : {}),
          },
        },
      }
    : variants;

  return (
    <MotionComponent
      variants={customVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={cn(className)}
    >
      {children}
    </MotionComponent>
  );
}
