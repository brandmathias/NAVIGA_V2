/**
 * NAVIGA Motion System — Corporate archetype
 *
 * Motion Personality: Corporate
 * Signature easing: MD3 Standard (0.2, 0, 0, 1)
 * Duration palette: quick=200ms | standard=350ms | slow=500ms
 * Entrance pattern: fade-up with decelerate
 *
 * Three motion layers:
 *   Primary   — scroll reveals, page transitions
 *   Secondary — stagger cascades, shadow arrivals
 *   Ambient   — subtle gradients, background life
 */

import type { Variants, Transition } from 'framer-motion';

/* ── Easing constants ─────────────────────────────────── */
export const EASE_ENTRANCE   = [0.2, 0, 0, 1]   as [number, number, number, number]; // MD3 Standard — decelerate
export const EASE_EXIT       = [0.3, 0, 1, 1]    as [number, number, number, number]; // MD3 Accelerate
export const EASE_MOVE       = [0.4, 0, 0.2, 1]  as [number, number, number, number]; // Gentle float — on-screen
export const EASE_EMPHASIZED = [0.05, 0.7, 0.1, 1] as [number, number, number, number]; // MD3 Emphasized — attention

/* ── Duration constants (ms → seconds) ────────────────── */
export const DUR_QUICK    = 0.2;
export const DUR_STANDARD = 0.35;
export const DUR_SLOW     = 0.5;
export const DUR_PAGE     = 0.28; // Page transitions

/* ── Stagger budgets ──────────────────────────────────── */
export const STAGGER_MICRO    = 0.03;  // 30ms — list items, grid cells
export const STAGGER_STANDARD = 0.06;  // 60ms — cards, panels
export const STAGGER_DRAMATIC = 0.12;  // 120ms — hero sections

/* ── Page transition variants ─────────────────────────── */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DUR_PAGE,
      ease: EASE_ENTRANCE,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: DUR_QUICK,
      ease: EASE_EXIT,
    },
  },
};

/* ── Scroll reveal: fade up ───────────────────────────── */
export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DUR_STANDARD,
      ease: EASE_ENTRANCE,
    },
  },
};

/* ── Scroll reveal: fade in (no movement) ─────────────── */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DUR_STANDARD,
      ease: EASE_MOVE,
    },
  },
};

/* ── Scroll reveal: scale up ──────────────────────────── */
export const scaleUpVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DUR_STANDARD,
      ease: EASE_ENTRANCE,
    },
  },
};

/* ── Scroll reveal: slide from left ───────────────────── */
export const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -32,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DUR_STANDARD,
      ease: EASE_ENTRANCE,
    },
  },
};

/* ── Scroll reveal: slide from right ──────────────────── */
export const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 32,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DUR_STANDARD,
      ease: EASE_ENTRANCE,
    },
  },
};

/* ── Container with stagger children ──────────────────── */
export const staggerContainerVariants = (
  stagger: number = STAGGER_STANDARD,
  delayChildren: number = 0.08
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

/* ── Card entrance (for staggered children) ───────────── */
export const cardItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DUR_STANDARD,
      ease: EASE_ENTRANCE,
    },
  },
};

/* ── Hover lift effect (for cards) ────────────────────── */
export const hoverLiftTransition: Transition = {
  duration: 0.2,
  ease: EASE_ENTRANCE,
};

/* ── Sidebar item entrance ────────────────────────────── */
export const sidebarItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -12,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DUR_QUICK,
      ease: EASE_ENTRANCE,
    },
  },
};
