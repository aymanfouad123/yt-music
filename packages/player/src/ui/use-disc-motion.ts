"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValue, useTransform } from "motion/react";
import { loadArtwork, type Artwork } from "../core/artwork";
import { animateDisc, type DiscTiming } from "../core/disc-motion";
import { cssTimeInSeconds } from "../core/sleeve-motion";
import type { RecordPlayerProps } from "./record";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type Face = { key: string; artwork: Artwork | null };

async function prepareFace(videoId?: string, artworkUrl?: string): Promise<Artwork | null> {
  if (!artworkUrl) return videoId ? loadArtwork(videoId) : null;
  const image = new Image();
  image.src = artworkUrl;
  await image.decode().catch(() => {});
  return { src: artworkUrl, letterboxed: false };
}

export function useDiscMotion({ track, artworkUrl, isPlaying }: RecordPlayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const angle = useMotionValue(0);
  const opacity = useMotionValue(0);
  const reducedMotion = usePrefersReducedMotion();
  const videoId = track?.videoId;
  const key = JSON.stringify([videoId, artworkUrl]);
  const [face, setFace] = useState<Face>({ key: "", artwork: null });
  const presented = useRef(face);
  const committed = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    presented.current = face;
    committed.current?.();
    committed.current = null;
  }, [face]);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    const tokens = getComputedStyle(ref.current);
    const curve = (name: string) => tokens.getPropertyValue(name).match(/[\d.]+/g)!.map(Number) as DiscTiming["ease"];
    let artwork: Artwork | null = null;
    const change = presented.current.key === key ? undefined : {
      ready: prepareFace(videoId, artworkUrl).then(result => { artwork = result; }),
      commit: () => new Promise<void>(resolve => {
        if (cancelled) { resolve(); return; }
        committed.current = resolve;
        setFace({ key, artwork });
      }),
    };
    const stop = animateDisc({ angle, opacity }, isPlaying, Boolean(reducedMotion), {
      align: cssTimeInSeconds(tokens.getPropertyValue("--ytm-dur-record-align"), 0.36),
      fade: cssTimeInSeconds(tokens.getPropertyValue("--ytm-dur-fast"), 0.18),
      settleEase: curve("--ytm-ease-drawer"),
      ease: curve("--ytm-ease-out"),
    }, change);
    return () => {
      cancelled = true;
      stop();
      committed.current?.();
      committed.current = null;
    };
  }, [key, videoId, artworkUrl, isPlaying, reducedMotion, angle, opacity]);

  return { ref, artwork: face.artwork, opacity, rotation: useTransform(angle, value => `rotate(${value}deg)`) };
}
