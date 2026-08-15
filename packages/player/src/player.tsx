"use client";

import { type CSSProperties, type KeyboardEvent, useRef } from "react";
import { parsePlaylistUrl } from "./core/parse-playlist-url";
import { useArtworkColor } from "./core/use-artwork-color";
import { type PlayerController, useYouTubePlayer } from "./core/use-player";
import { cx } from "./ui/cx";
import { ErrorState, LiveRegion } from "./ui/chrome";
import { Card } from "./variants/card";
import { Compact } from "./variants/compact";
import { Pill } from "./variants/pill";
import { Playlist } from "./variants/playlist";
import "./styles";

export type Variant = "card" | "pill" | "playlist";
export type Theme = "gradient" | "dark" | "light";

type LayoutProps =
  | { variant: "card"; compact?: boolean }
  | { variant?: "pill"; compact?: never }
  | { variant: "playlist"; compact?: never };

export type YouTubeMusicPlayerProps = LayoutProps & {
  url: string;
  theme?: Theme;
  className?: string;
};

export type VariantProps = {
  player: PlayerController;
  playlistUrl: string;
  musicUrl: string;
};

function renderVariant(variant: Variant, props: VariantProps, compact: boolean) {
  switch (variant) {
    case "card":
      return compact ? <Compact {...props} /> : <Card {...props} />;
    case "playlist":
      return <Playlist {...props} />;
    default:
      return <Pill {...props} />;
  }
}

export function YouTubeMusicPlayer({
  url,
  variant = "pill",
  theme = "gradient",
  compact = false,
  className,
}: YouTubeMusicPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playlistId = parsePlaylistUrl(url);
  const player = useYouTubePlayer(playlistId, mountRef);
  const { status, track, isLoading, clock, actions } = player;
  const background = useArtworkColor(theme === "gradient" ? track?.videoId : undefined);
  const playlistUrl = playlistId
    ? `https://music.youtube.com/playlist?list=${playlistId}`
    : "https://music.youtube.com/";
  const musicUrl = track
    ? `https://music.youtube.com/watch?v=${track.videoId}${
        playlistId ? `&list=${playlistId}` : ""
      }`
    : playlistUrl;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || isLoading) return;
    if (event.key === " ") actions.toggle();
    else if (event.key === "ArrowLeft") actions.seek(clock.now() - 5);
    else if (event.key === "ArrowRight") actions.seek(clock.now() + 5);
    else return;
    event.preventDefault();
  };

  return (
    <div
      className={cx("ytm-root", className)}
      data-variant={variant}
      data-theme={theme}
      data-compact={(variant === "card" && compact) || undefined}
      style={
        {
          ...(theme === "gradient" && { "--ytm-bg": background }),
        } as CSSProperties
      }
    >
      <div
        className="ytm-surface"
        role="region"
        aria-label="YouTube Music player"
        aria-busy={isLoading}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {status === "error" ? (
          <ErrorState href={playlistUrl} />
        ) : (
          renderVariant(variant, { player, playlistUrl, musicUrl }, compact)
        )}
      </div>
      <LiveRegion track={track} />
      <div ref={mountRef} className="ytm-engine" aria-hidden="true" />
    </div>
  );
}
