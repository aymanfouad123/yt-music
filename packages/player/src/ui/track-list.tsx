"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { knownDuration, type PlayerController } from "../core/use-player";
import { Artwork } from "./artwork";
import { PlayIcon } from "./icons";
import { formatTime } from "./scrubber";

const LIMIT = 200;
const EDGE = 16;
const PLACEHOLDERS = 5;

function TrackArtwork({ id }: { id: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "120px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className="ytm-row-thumb">
      {visible && <Artwork id={id} direction={null} />}
    </span>
  );
}

function Skeleton() {
  return (
    <>
      <span className="ytm-skeleton ytm-skeleton-title" />
      <span className="ytm-skeleton ytm-skeleton-artist" />
    </>
  );
}

type TrackListProps = {
  player: PlayerController;
  playlistUrl: string;
};

export function TrackList({ player, playlistUrl }: TrackListProps) {
  const { ids, index, meta, isPlaying, isLoading, actions } = player;
  const listRef = useRef<HTMLOListElement>(null);
  const touchedAt = useRef(-Infinity);
  const rows = ids.slice(0, LIMIT);
  const tabStop = index < rows.length ? index : 0;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const updateEdges = () => {
      list.toggleAttribute("data-scroll-top", list.scrollTop > 1);
      list.toggleAttribute("data-scroll-bottom", list.scrollHeight - list.clientHeight - list.scrollTop > 1);
    };
    updateEdges();
    list.addEventListener("scroll", updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    for (const row of list.children) observer.observe(row);
    return () => {
      list.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, [isLoading, rows.length]);

  useEffect(() => {
    const list = listRef.current;
    const row = list?.children[index] as HTMLElement | undefined;
    if (!list || !row || performance.now() - touchedAt.current < 2000) return;
    const top = row.offsetTop - EDGE;
    const bottom = row.offsetTop + row.offsetHeight + EDGE - list.clientHeight;
    const target =
      list.scrollTop > top ? top : list.scrollTop < bottom ? bottom : null;
    if (target === null) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
  }, [index]);

  const touch = () => {
    touchedAt.current = performance.now();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    touch();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(":scope > li > *"),
    );
    const at = items.indexOf(event.target as HTMLElement);
    const moves: Record<string, number> = {
      ArrowDown: at + 1,
      ArrowUp: at - 1,
      Home: 0,
      End: items.length - 1,
    };
    const target = items[moves[event.key]];
    if (at < 0 || !target) return;
    event.preventDefault();
    target.focus();
  };

  if (isLoading) {
    return (
      <ol className="ytm-tracks" aria-hidden="true">
        {Array.from({ length: PLACEHOLDERS }, (_, i) => (
          <li key={i}>
            <span className="ytm-row">
              <span />
              <span className="ytm-row-thumb" />
              <span className="ytm-row-text">
                <Skeleton />
              </span>
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol
      ref={listRef}
      className="ytm-tracks"
      data-long-index={rows.length >= 100 || undefined}
      role="list"
      aria-label="Tracks"
      onWheel={touch}
      onTouchMove={touch}
      onPointerDown={touch}
      onKeyDown={handleKeyDown}
    >
      {rows.map((id, i) => {
        const active = i === index;
        const info = meta.get(id);
        const length = knownDuration(id);
        const label = info
          ? `${info.title} by ${info.artist}`
          : `track ${i + 1}`;
        return (
          <li key={`${i}-${id}`}>
            <button
              className="ytm-row"
              type="button"
              tabIndex={i === tabStop ? 0 : -1}
              data-active={active || undefined}
              aria-current={active || undefined}
              aria-label={`${active && isPlaying ? "Pause" : "Play"} ${label}`}
              onClick={() => actions.playAt(i)}
            >
              <span className="ytm-row-index">
                {active ? (
                  <span className="ytm-eq" data-playing={isPlaying || undefined}>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <>
                    <span className="ytm-row-number">{i + 1}</span>
                    <PlayIcon />
                  </>
                )}
              </span>
              <TrackArtwork id={id} />
              <span className="ytm-row-text">
                {info ? (
                  <>
                    <span className="ytm-row-title">{info.title}</span>
                    <span className="ytm-row-artist">{info.artist}</span>
                  </>
                ) : (
                  <Skeleton />
                )}
              </span>
              <span className="ytm-row-duration">
                {length ? formatTime(length) : ""}
              </span>
            </button>
          </li>
        );
      })}
      {ids.length > LIMIT && (
        <li>
          <a
            className="ytm-row ytm-row-more"
            href={playlistUrl}
            target="_blank"
            rel="noreferrer"
            tabIndex={-1}
          >
            Open full playlist in YouTube Music
          </a>
        </li>
      )}
    </ol>
  );
}
