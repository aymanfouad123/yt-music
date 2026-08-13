"use client";

import { useEffect, useState } from "react";
import { type Artwork as Source, loadArtwork } from "../core/artwork";
import type { Direction } from "../core/use-player";
import { cx } from "./cx";
import { useSwap } from "./use-swap";

type Ready = { id: string; art: Source | null };

/** Holds the previous artwork until the next one is decoded (or 150ms pass). */
function useReadyArtwork(id?: string) {
  const [ready, setReady] = useState<Ready>();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const timer = window.setTimeout(() => setReady({ id, art: null }), 150);
    void loadArtwork(id).then((art) => {
      if (cancelled) return;
      window.clearTimeout(timer);
      setReady({ id, art });
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  return ready;
}

type ArtworkProps = {
  id?: string;
  direction: Direction;
  className?: string;
};

export function Artwork({ id, direction, className }: ArtworkProps) {
  const ready = useReadyArtwork(id);
  const layers = useSwap(ready?.id, ready?.art ?? null, direction);

  return (
    <div
      className={cx("ytm-artwork", className)}
      data-empty={layers.length === 0 || undefined}
      aria-hidden="true"
    >
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="ytm-artwork-layer"
          data-state={layer.state}
          data-direction={layer.direction ?? undefined}
        >
          {layer.value && (
            // Plain img keeps the component portable outside Next.js.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={layer.value.src}
              data-letterboxed={layer.value.letterboxed || undefined}
              crossOrigin="anonymous"
              alt=""
              draggable={false}
            />
          )}
        </div>
      ))}
    </div>
  );
}
