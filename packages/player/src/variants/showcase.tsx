"use client";

import type { VariantProps } from "../player";
import { BrandLink } from "../ui/chrome";
import { Coverflow } from "../ui/coverflow";
import { Scrubber } from "../ui/scrubber";
import { TrackText } from "../ui/track-text";
import { Transport } from "../ui/transport";

export function Showcase({ player, musicUrl }: VariantProps) {
  const { track, direction, clock, duration, isPlaying, actions } = player;

  return (
    <div className="ytm-showcase">
      <Coverflow player={player} />
      <div className="ytm-showcase-panel">
        <div className="ytm-showcase-heading">
          <TrackText track={track} direction={direction} />
          <BrandLink href={musicUrl} />
        </div>
        <div className="ytm-showcase-controls">
          <Transport player={player} />
          <Scrubber clock={clock} duration={duration} isPlaying={isPlaying} onSeek={actions.seek} labels="below" />
        </div>
      </div>
    </div>
  );
}
