"use client";

import type { Track } from "../core/use-player";
import { Artwork } from "./artwork";
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon } from "./icons";

/** Controlled presentation: connect any audio engine with three callbacks. */
export type RecordPlayerProps = {
  track: Track | null;
  artworkUrl?: string;
  isPlaying: boolean;
  isBuffering?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
};

export function RecordArt({ track, artworkUrl }: Pick<RecordPlayerProps, "track" | "artworkUrl">) {
  return artworkUrl ? (
    // A plain image keeps the component usable in any React project.
    // eslint-disable-next-line @next/next/no-img-element
    <img className="ytm-record-image" src={artworkUrl} alt="" draggable={false} />
  ) : <Artwork id={track?.videoId} direction={null} />;
}

export function RecordGlyph({ isPlaying }: Pick<RecordPlayerProps, "isPlaying">) {
  return <span className="ytm-record-glyph" data-playing={isPlaying} aria-hidden="true"><PlayIcon /><PauseIcon /></span>;
}

export function RecordSkip({ onClick, previous, disabled }: { onClick?: () => void; previous?: boolean; disabled?: boolean }) {
  return <button type="button" className="ytm-icon-button ytm-record-skip" aria-label={previous ? "Previous track" : "Next track"} onClick={onClick} disabled={disabled || !onClick}>
    {previous ? <PreviousIcon /> : <NextIcon />}
  </button>;
}

export function RecordDetails({ track }: Pick<RecordPlayerProps, "track">) {
  return <div className="ytm-record-details">
    <p className="ytm-record-title" title={track?.title}>{track?.title || "A little music"}</p>
    <p className="ytm-record-artist" title={track?.artist}>{track?.artist || "Your next favorite, on repeat."}</p>
  </div>;
}

export function RecordStatus({ isPlaying, isBuffering }: Pick<RecordPlayerProps, "isPlaying" | "isBuffering">) {
  return <span className="ytm-record-status" role="status">
    <span className="ytm-record-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
    <span>{isBuffering ? "Loading audio" : isPlaying ? "Now playing" : "Ready when you are"}</span>
  </span>;
}
