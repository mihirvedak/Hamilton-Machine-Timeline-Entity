import { useRef, useState, useEffect } from "react";
import type { Variants } from "framer-motion";

interface AnimationConfig {
  shouldAnimate: boolean;
  hasAnimated: boolean;
}

export const useDashboardAnimation = (): AnimationConfig => {
  const hasAnimatedRef = useRef(false);
  
  // Start with TRUE so first render has animations ready
  const shouldAnimate = !hasAnimatedRef.current;
  
  useEffect(() => {
    // Mark as animated after first render completes
    hasAnimatedRef.current = true;
  }, []);

  return { shouldAnimate, hasAnimated: hasAnimatedRef.current };
};

// Row 1: Gauge cards container (0ms start, 250ms stagger)
export const gaugeContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0,
    },
  },
};

// Individual gauge card animation
export const gaugeCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 25,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Row 2: OEE Breakdown + KPI Cards container (1000ms start)
export const row2ContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 1.0,
      staggerChildren: 0.2,
    },
  },
};

// Chart card animation (OEE Breakdown, Production vs Rejection)
export const chartCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// KPI cards animation
export const kpiCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

// KPI container with proper delay starting at 1125ms
export const kpiContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 1.125,
      staggerChildren: 0.2,
    },
  },
};

// Row 3: Production vs Rejection (2000ms delay)
export const row3Variants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 2.0,
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Row 4: Pareto charts container (2500ms start, 200ms stagger)
export const paretoContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 2.5,
      staggerChildren: 0.2,
    },
  },
};

// Individual pareto chart animation
export const paretoCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Row 5: Donut charts container (3500ms start, 375ms stagger)
export const donutContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 3.5,
      staggerChildren: 0.375,
    },
  },
};

// Individual donut chart animation
export const donutVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};
