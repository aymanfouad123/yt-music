import type { PlayerController } from "../core/use-player";
import { cx } from "./cx";
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon } from "./icons";

type TransportProps = {
  player: PlayerController;
  size?: "sm" | "md";
  className?: string;
  playOnly?: boolean;
};

export function Transport({ player, size = "sm", playOnly = false, className }: TransportProps) {
  const { isPlaying, isBuffering, isLoading, status, actions } = player;
  const disabled = isLoading || status === "error";

  return (
    <div className={cx("ytm-transport", className)} data-size={size}>
      {!playOnly && <button
        className="ytm-icon-button ytm-skip"
        type="button"
        onClick={actions.previous}
        disabled={disabled}
        aria-label="Previous track"
      >
        <PreviousIcon />
      </button>}
      <button
        className="ytm-play-button"
        type="button"
        data-playing={isPlaying}
        data-buffering={isBuffering}
        onClick={actions.toggle}
        disabled={disabled}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <PlayIcon className="ytm-play-icon" />
        <PauseIcon className="ytm-pause-icon" />
      </button>
      {!playOnly && <button
        className="ytm-icon-button ytm-skip"
        type="button"
        onClick={actions.next}
        disabled={disabled}
        aria-label="Next track"
      >
        <NextIcon />
      </button>}
    </div>
  );
}
