'use client';

/**
 * StaggerContainer — orchestrates staggered child animations
 *
 * Wraps a group of children and reveals them with a stagger delay.
 * Children should use <StaggerItem> for coordinated entrance.
 *
 * Choreography:
 *   1/3 Rule — no more than 1/3 of elements in active motion simultaneously
 *   Spatial consistency — all elements enter from same direction
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  staggerContainerVariants,
  cardItemVariants,
  STAGGER_STANDARD,
} from './variants';
import { cn } from '@/lib/utils';

interface StaggerContainerProps {
  children: React.ReactNode;
  stagger?: number;
  delayChildren?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

export function StaggerContainer({
  children,
  stagger = STAGGER_STANDARD,
  delayChildren = 0.08,
  className,
  once = true,
  amount = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      variants={staggerContainerVariants(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={cardItemVariants} className={cn(className)}>
      {children}
    </motion.div>
  );
}
