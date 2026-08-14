import type { VariantProps } from "../player";
import { Artwork } from "../ui/artwork";
import { TrackText } from "../ui/track-text";
import { Transport } from "../ui/transport";

export function Pill({ player }: VariantProps) {
  const { track, direction } = player;

  return (
    <div className="ytm-pill">
      <Artwork id={track?.videoId} direction={direction} />
      <div className="ytm-pill-details">
        <TrackText track={track} direction={direction} />
      </div>
      <Transport player={player} playOnly />
    </div>
  );
}
