"use client";

import { cn } from "@ferix/ui/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Smooth transition configuration inspired by Linear and Stripe.
 * Uses easeOut for a natural deceleration feel.
 */
const transitionConfig = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1.0] as const, // Custom cubic-bezier for smooth feel
};

interface SkeletonTransitionProps {
  /** Whether the content is loading */
  isLoading: boolean;
  /** The skeleton component to show while loading */
  skeleton: ReactNode;
  /** The actual content to show when loaded */
  children: ReactNode;
  /** Optional className for the wrapper */
  className?: string;
  /**
   * Transition mode:
   * - "wait": Skeleton exits before content enters (cleaner, sequential)
   * - "sync": Both animate simultaneously (faster, but can look busy)
   * - "crossfade": Uses layoutId for smooth morphing effect
   */
  mode?: "wait" | "sync" | "crossfade";
  /** Unique ID for layoutId-based crossfade transitions */
  layoutId?: string;
  /** Optional delay before content appears (useful for staggered grids) */
  delay?: number;
}

/**
 * SkeletonTransition - Smooth transition wrapper from skeleton to content.
 *
 * Provides a polished loading experience with configurable transition modes
 * inspired by Linear and Stripe's attention to loading state details.
 *
 * @example
 * // Basic usage with wait mode (recommended)
 * <SkeletonTransition
 *   isLoading={!data}
 *   skeleton={<RepositoryCellSkeleton />}
 * >
 *   <RepositoryCell repository={data} />
 * </SkeletonTransition>
 *
 * @example
 * // Crossfade mode for card-like transitions
 * <SkeletonTransition
 *   isLoading={!data}
 *   skeleton={<CardSkeleton />}
 *   mode="crossfade"
 *   layoutId="card-1"
 * >
 *   <Card data={data} />
 * </SkeletonTransition>
 *
 * @example
 * // With staggered delay for grid items
 * {items.map((item, index) => (
 *   <SkeletonTransition
 *     key={item.id}
 *     isLoading={!item.loaded}
 *     skeleton={<ItemSkeleton />}
 *     delay={index * 0.05}
 *   >
 *     <Item data={item} />
 *   </SkeletonTransition>
 * ))}
 */
export function SkeletonTransition({
  isLoading,
  skeleton,
  children,
  className,
  mode = "wait",
  layoutId,
  delay = 0,
}: SkeletonTransitionProps) {
  // For crossfade mode, use layoutId for shared element transitions
  if (mode === "crossfade" && layoutId) {
    return (
      <div className={cn("relative", className)}>
        <AnimatePresence mode="sync">
          {isLoading ? (
            <motion.div
              key="skeleton"
              layoutId={layoutId}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionConfig}
            >
              {skeleton}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              layoutId={layoutId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transitionConfig, delay }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // For wait and sync modes, use standard AnimatePresence
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode={mode === "wait" ? "wait" : "sync"}>
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={transitionConfig}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionConfig, delay }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Fade-only variant for simpler transitions without scale/translate.
 * Useful for inline content or text replacements.
 */
export function SkeletonFade({
  isLoading,
  skeleton,
  children,
  className,
  delay = 0,
}: Omit<SkeletonTransitionProps, "mode" | "layoutId">) {
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { SkeletonTransitionProps };
