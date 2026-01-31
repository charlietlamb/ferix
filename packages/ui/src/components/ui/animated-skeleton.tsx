"use client";

import { cn } from "@ferix/ui/lib/utils";
import { motion } from "motion/react";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Shimmer animation variant using Motion for smoother, more controllable animations.
 * Inspired by Linear, Stripe, and other leading design systems.
 */
const shimmerTransition = {
  duration: 1.5,
  ease: "easeInOut" as const,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "loop" as const,
};

type AnimatedSkeletonVariant =
  | "default"
  | "text"
  | "avatar"
  | "card"
  | "button"
  | "icon";

const variantClasses: Record<AnimatedSkeletonVariant, string> = {
  default: "rounded-md",
  text: "rounded h-4",
  avatar: "rounded-full",
  card: "rounded-lg",
  button: "rounded-md h-9",
  icon: "rounded size-5",
};

interface AnimatedSkeletonProps
  extends Omit<ComponentPropsWithoutRef<typeof motion.div>, "animate"> {
  /** Skeleton variant for common use cases */
  variant?: AnimatedSkeletonVariant;
  /** Custom delay for staggered animations (in seconds) */
  delay?: number;
  /** Whether to show the shimmer animation */
  shimmer?: boolean;
}

/**
 * AnimatedSkeleton - A polished skeleton loader with smooth shimmer effect.
 *
 * Uses Motion for hardware-accelerated animations, providing a premium
 * loading experience similar to Linear and Stripe.
 *
 * @example
 * // Basic usage
 * <AnimatedSkeleton className="h-4 w-32" />
 *
 * @example
 * // With variant
 * <AnimatedSkeleton variant="avatar" className="size-10" />
 *
 * @example
 * // Staggered animation
 * <AnimatedSkeleton delay={0.1} className="h-4 w-full" />
 * <AnimatedSkeleton delay={0.2} className="h-4 w-3/4" />
 */
export function AnimatedSkeleton({
  className,
  variant = "default",
  delay = 0,
  shimmer = true,
  style,
  ...props
}: AnimatedSkeletonProps) {
  return (
    <motion.div
      data-slot="animated-skeleton"
      className={cn(
        "relative overflow-hidden bg-muted",
        variantClasses[variant],
        className
      )}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.3,
        delay,
      }}
      style={style}
      {...props}
    >
      {shimmer && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.06) 50%, transparent 100%)",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            ...shimmerTransition,
            delay,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * AnimatedSkeletonText - Skeleton optimized for text content with proper line height.
 */
export function AnimatedSkeletonText({
  className,
  delay = 0,
  ...props
}: Omit<AnimatedSkeletonProps, "variant">) {
  return (
    <AnimatedSkeleton
      variant="text"
      className={cn("h-4", className)}
      delay={delay}
      {...props}
    />
  );
}

/**
 * AnimatedSkeletonAvatar - Circular skeleton for avatar placeholders.
 */
export function AnimatedSkeletonAvatar({
  className,
  delay = 0,
  ...props
}: Omit<AnimatedSkeletonProps, "variant">) {
  return (
    <AnimatedSkeleton
      variant="avatar"
      className={cn("size-10", className)}
      delay={delay}
      {...props}
    />
  );
}

export type { AnimatedSkeletonProps, AnimatedSkeletonVariant };
