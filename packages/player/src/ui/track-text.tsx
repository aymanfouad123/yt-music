"use client";

import type { Direction, Track } from "../core/use-player";
import { cx } from "./cx";
import { useSwap } from "./use-swap";

type TrackTextProps = {
  track: Track | null;
  direction: Direction;
  className?: string;
};

export function TrackText({
  track,
  direction,
  className,
}: TrackTextProps) {
  const layers = useSwap(track?.videoId, track, direction);

  return (
    <div className={cx("ytm-text", className)}>
      {layers.length === 0 && (
        <div className="ytm-text-layer" aria-hidden="true">
          <span className="ytm-skeleton ytm-skeleton-title" />
          <span className="ytm-skeleton ytm-skeleton-artist" />
        </div>
      )}
      {layers.map(({ key, value, state, direction: from }) => (
        <div
          key={key}
          className="ytm-text-layer"
          data-state={state}
          data-direction={from ?? undefined}
          aria-hidden={state === "exit" || undefined}
        >
          {!value?.title ? (
            <span className="ytm-skeleton ytm-skeleton-title" />
          ) : (
            <p className="ytm-title" title={value.title}>
              {value.title}
            </p>
          )}
          {value?.artist ? (
            <p className="ytm-artist" title={value.artist}>
              {value.artist}
            </p>
          ) : (
            <span className="ytm-skeleton ytm-skeleton-artist" />
          )}
        </div>
      ))}
    </div>
  );
}
