import type { Track } from "../core/use-player";
import { cx } from "./cx";
import { YouTubeMusicMark } from "./icons";

export function BrandLink({
  href,
  label = "Open this track in YouTube Music",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      className={cx("ytm-brand", className)}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
    >
      <YouTubeMusicMark />
    </a>
  );
}

export function LiveRegion({ track }: { track: Track | null }) {
  return (
    <span className="ytm-sr-only" aria-live="polite">
      {track?.title ? `Now playing: ${track.title} by ${track.artist}` : ""}
    </span>
  );
}

export function ErrorState({ href }: { href: string }) {
  return (
    <div className="ytm-error">
      <div className="ytm-error-copy">
        <p className="ytm-error-title">This playlist can’t be played</p>
        <p className="ytm-error-body">
          It may be private, unavailable, or the link may be invalid.
        </p>
      </div>
      <BrandLink href={href} label="Open in YouTube Music" />
    </div>
  );
}
