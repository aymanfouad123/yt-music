import type { VariantProps } from "../player";
import { Artwork } from "../ui/artwork";
import { BrandLink } from "../ui/chrome";
import { Scrubber } from "../ui/scrubber";
import { TrackText } from "../ui/track-text";
import { Transport } from "../ui/transport";

export function Pill({ player, musicUrl, wide, showProgress }: VariantProps & { wide: boolean; showProgress: boolean }) {
  const { track, direction, clock, duration, isPlaying, actions } = player;

  return (
    <div className="ytm-pill">
      <Artwork id={track?.videoId} direction={direction} />
      <div className="ytm-pill-details">
        <TrackText track={track} direction={direction} />
        {showProgress && (
          <Scrubber clock={clock} duration={duration} isPlaying={isPlaying} onSeek={actions.seek} labels="elapsed-total" />
        )}
      </div>
      <Transport player={player} playOnly={!wide} />
      {wide && <BrandLink href={musicUrl} />}
    </div>
  );
}
