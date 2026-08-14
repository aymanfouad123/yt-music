"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ProgressClock } from "../core/use-player";
import { cx } from "./cx";

export function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) value = 0;
  const total = Math.floor(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = (total % 60).toString().padStart(2, "0");
  return hours
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

function setText(element: HTMLElement | null, text: string) {
  if (element && element.textContent !== text) element.textContent = text;
}

type ScrubberProps = {
  clock: ProgressClock;
  duration: number;
  isPlaying: boolean;
  onSeek(seconds: number): void;
  /** Time bubble or elapsed / remaining row. */
  labels?: "preview" | "below";
  className?: string;
};

export function Scrubber({
  clock,
  duration,
  isPlaying,
  onSeek,
  labels = "preview",
  className,
}: ScrubberProps) {
  const hitRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const previewRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef<HTMLSpanElement>(null);
  const remainingRef = useRef<HTMLSpanElement>(null);
  const durationRef = useRef(duration);
  const dragRef = useRef<number | null>(null);

  const paint = useCallback(() => {
    const length = durationRef.current;
    const time = dragRef.current ?? clock.now();
    const ratio = length > 0 ? Math.min(1, Math.max(0, time / length)) : 0;
    if (fillRef.current) {
      fillRef.current.style.transform = `translateX(${(ratio - 1) * 100}%)`;
    }
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translateX(${ratio * 100}%)`;
    }
    const elapsed = formatTime(time);
    setText(elapsedRef.current, elapsed);
    setText(remainingRef.current, length > 0 ? `-${formatTime(length - time)}` : "");
    const hit = hitRef.current;
    if (hit && hit.getAttribute("aria-valuenow") !== String(Math.floor(time))) {
      hit.setAttribute("aria-valuenow", String(Math.floor(time)));
      hit.setAttribute("aria-valuetext", `${elapsed} of ${formatTime(length)}`);
    }
  }, [clock]);

  useEffect(() => {
    durationRef.current = duration;
    paint();
    const unsubscribe = clock.subscribe(paint);
    if (!isPlaying) return unsubscribe;
    let frame = requestAnimationFrame(function loop() {
      paint();
      frame = requestAnimationFrame(loop);
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [clock, duration, isPlaying, paint]);

  const locate = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.min(bounds.width, Math.max(0, event.clientX - bounds.left));
    const rail = previewRef.current;
    const bubble = rail?.firstElementChild as HTMLElement | null;
    if (rail && bubble) {
      setText(bubble, formatTime((x / bounds.width) * durationRef.current));
      const half = bubble.offsetWidth / 2 - 6;
      const clamped = Math.min(bounds.width - half, Math.max(half, x));
      rail.style.transform = `translateX(${clamped}px)`;
    }
    return (x / bounds.width) * durationRef.current;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (durationRef.current <= 0 || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "";
    dragRef.current = locate(event);
    paint();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const time = locate(event);
    if (dragRef.current === null) return;
    dragRef.current = time;
    paint();
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>, commit: boolean) => {
    const time = dragRef.current;
    if (time === null) return;
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
    if (commit) onSeek(time);
    paint();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: clock.now() - 5,
      ArrowRight: clock.now() + 5,
      Home: 0,
      End: durationRef.current - 1,
    };
    if (!(event.key in steps) || durationRef.current <= 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSeek(steps[event.key]);
  };

  return (
    <div className={cx("ytm-scrubber", className)} data-labels={labels}>
      <div
        ref={hitRef}
        className="ytm-scrubber-hit"
        role="slider"
        tabIndex={duration > 0 ? 0 : -1}
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={0}
        aria-disabled={duration <= 0 || undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => endDrag(event, true)}
        onPointerCancel={(event) => endDrag(event, false)}
        onKeyDown={handleKeyDown}
      >
        <span className="ytm-scrubber-track">
          <span ref={fillRef} className="ytm-scrubber-fill" />
        </span>
        <span ref={thumbRef} className="ytm-scrubber-rail">
          <span className="ytm-scrubber-thumb" />
        </span>
        {labels === "preview" && (
          <span ref={previewRef} className="ytm-scrubber-preview-rail">
            <span className="ytm-scrubber-preview" />
          </span>
        )}
      </div>
      {labels !== "preview" && (
        <div className="ytm-times" aria-hidden="true">
          <span ref={elapsedRef} />
          <span ref={remainingRef} />
        </div>
      )}
    </div>
  );
}
