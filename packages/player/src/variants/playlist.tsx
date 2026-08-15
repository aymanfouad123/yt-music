import type { VariantProps } from "../player";
import { Artwork } from "../ui/artwork";
import { BrandLink } from "../ui/chrome";
import { Scrubber } from "../ui/scrubber";
import { TrackList } from "../ui/track-list";
import { TrackText } from "../ui/track-text";
import { Transport } from "../ui/transport";

export function Playlist({ player, playlistUrl, musicUrl }: VariantProps) {
  const { track, direction, clock, duration, isPlaying, actions } = player;

  return (
    <div className="ytm-playlist">
      <div className="ytm-playlist-head">
        <Artwork id={track?.videoId} direction={direction} />
        <TrackText track={track} direction={direction} />
        <BrandLink href={musicUrl} />
      </div>
      <div className="ytm-playlist-controls">
        <Scrubber
          clock={clock}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={actions.seek}
          labels="below"
        />
        <Transport player={player} size="md" />
      </div>
      <TrackList player={player} playlistUrl={playlistUrl} />
    </div>
  );
}
