"use client";

import { motion } from "motion/react";
import { cx } from "../ui/cx";
import { useDiscMotion } from "../ui/use-disc-motion";
import { RecordDetails, RecordSkip, RecordStatus, type RecordPlayerProps } from "../ui/record";
import "../styles";

/** A floating artwork CD. Rotation holds its position when playback pauses. */
export function DiscPlayer(props: RecordPlayerProps) {
  const { isPlaying, isBuffering, disabled, onToggle, onPrevious, onNext, className } = props;
  const { ref, artwork, opacity, rotation } = useDiscMotion(props);
  return <div ref={ref} className={cx("ytm-root ytm-record ytm-disc-player", className)} data-playing={isPlaying} data-buffering={isBuffering || undefined}>
    <div className="ytm-disc-transport">
      <RecordSkip previous onClick={onPrevious} disabled={disabled} />
      <button className="ytm-record-button ytm-disc-button" type="button" aria-label={isPlaying ? "Pause" : "Play"} aria-pressed={isPlaying} disabled={disabled} onClick={onToggle}>
        <motion.span className="ytm-disc-rotor" style={{ transform: rotation, opacity }}>
          {artwork && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ytm-record-image" src={artwork.src} data-letterboxed={artwork.letterboxed || undefined} alt="" draggable={false} />
          )}
        </motion.span>
        <span className="ytm-disc-finish" aria-hidden="true" />
        <span className="ytm-disc-hub" aria-hidden="true" />
      </button>
      <RecordSkip onClick={onNext} disabled={disabled} />
    </div>
    <RecordDetails track={props.track} />
    <RecordStatus isPlaying={isPlaying} isBuffering={isBuffering} />
  </div>;
}
