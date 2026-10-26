"use client";

import { motion } from "motion/react";
import { useSleeveMotion } from "../ui/use-sleeve-motion";
import { cx } from "../ui/cx";
import { RecordArt, RecordDetails, RecordGlyph, RecordSkip, RecordStatus, type RecordPlayerProps } from "../ui/record";
import "../styles";

/** The cover lifts and rounds into a CD, revealing the listening surface below. */
export function SleevePlayer(props: RecordPlayerProps) {
  const { isPlaying, isBuffering, disabled, onToggle, onPrevious, onNext, className } = props;
  const { ref, open, roundness, coverTransform, clipPath, rotation, detailsTransform } = useSleeveMotion(isPlaying);
  return <div ref={ref} className={cx("ytm-root ytm-record ytm-sleeve-player", className)} data-playing={isPlaying} data-buffering={isBuffering || undefined}>
    <div className="ytm-sleeve-window">
      <motion.div className="ytm-sleeve-inner" inert={!isPlaying} style={{ opacity: open, transform: detailsTransform }}>
        <RecordStatus isPlaying={isPlaying} isBuffering={isBuffering} />
        <RecordDetails track={props.track} />
        <div className="ytm-sleeve-controls">
          <RecordSkip previous onClick={onPrevious} disabled={disabled} />
          <button className="ytm-record-button ytm-sleeve-pause" type="button" onClick={onToggle} disabled={disabled} aria-label={isPlaying ? "Pause" : "Play"}><RecordGlyph isPlaying={isPlaying} /></button>
          <RecordSkip onClick={onNext} disabled={disabled} />
        </div>
      </motion.div>
      <motion.div style={{ transform: coverTransform }} className="ytm-sleeve-lift">
        <motion.span className="ytm-sleeve-shape" style={{ clipPath: clipPath }}>
          <motion.span className="ytm-sleeve-rotor" style={{ transform: rotation }}><RecordArt {...props} /></motion.span>
          <motion.span className="ytm-disc-finish" style={{ opacity: roundness }} aria-hidden="true" />
          <motion.span className="ytm-disc-hub" style={{ opacity: roundness }} aria-hidden="true" />
        </motion.span>
        <button className="ytm-record-button ytm-sleeve-cover" type="button" onClick={onToggle} disabled={disabled} aria-label={isPlaying ? "Pause" : "Play"} aria-pressed={isPlaying} />
      </motion.div>
    </div>
    <span className="ytm-sleeve-caption" aria-hidden="true">A sleeve for your sound.</span>
  </div>;
}
