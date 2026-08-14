import type { VariantProps } from "../player";
import { Artwork } from "../ui/artwork";
import { BrandLink } from "../ui/chrome";
import { Scrubber } from "../ui/scrubber";
import { TrackText } from "../ui/track-text";
import { Transport } from "../ui/transport";

export function Compact({ player, musicUrl }: VariantProps) {
  const { track, direction, clock, duration, isPlaying, actions } = player;

  return (
    <div className="ytm-compact">
      <div className="ytm-compact-content">
        <Artwork id={track?.videoId} direction={direction} />
        <TrackText track={track} direction={direction} />
        <Transport player={player} />
        <BrandLink href={musicUrl} />
      </div>
      <Scrubber
        clock={clock}
        duration={duration}
        isPlaying={isPlaying}
        onSeek={actions.seek}
      />
    </div>
  );
}
