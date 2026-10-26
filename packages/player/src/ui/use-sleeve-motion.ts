"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform } from "motion/react";
import { animateSleeve, cssTimeInSeconds, type SleeveTiming } from "../core/sleeve-motion";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export function useSleeveMotion(isPlaying: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const open = useMotionValue(0);
  const roundness = useMotionValue(0);
  const angle = useMotionValue(0);
  const spinning = useMotionValue(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    const tokens = getComputedStyle(ref.current);
    const ease = tokens.getPropertyValue("--ytm-ease-out").match(/[\d.]+/g)!.map(Number) as SleeveTiming["ease"];
    const returnEase = tokens.getPropertyValue("--ytm-ease-in-out").match(/[\d.]+/g)!.map(Number) as SleeveTiming["ease"];
    const settleEase = tokens.getPropertyValue("--ytm-ease-drawer").match(/[\d.]+/g)!.map(Number) as SleeveTiming["ease"];
    return animateSleeve({ open, roundness, angle, spinning }, isPlaying, Boolean(reducedMotion), {
      travel: cssTimeInSeconds(tokens.getPropertyValue("--ytm-dur-track"), 0.28),
      settle: cssTimeInSeconds(tokens.getPropertyValue("--ytm-dur-record-align"), 0.36),
      unfold: cssTimeInSeconds(tokens.getPropertyValue("--ytm-dur-record-unfold"), 0.24),
      ease,
      returnEase,
      settleEase,
    });
  }, [isPlaying, reducedMotion, open, roundness, angle, spinning]);

  return {
    ref,
    coverTransform: useTransform(open, value => `translateY(${-50 * value}%)`),
    clipPath: useTransform(roundness, value => `inset(0 round ${8.5714 + 41.4286 * value}%)`),
    rotation: useTransform(angle, value => `rotate(${value}deg)`),
    detailsTransform: useTransform(open, value => `translateY(${8 * (1 - value)}px)`),
    open,
    roundness,
  };
}
