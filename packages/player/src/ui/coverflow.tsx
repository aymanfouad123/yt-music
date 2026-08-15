"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Artwork, loadArtwork, thumbnail } from "../core/artwork";
import { createSpring } from "../core/spring";
import type { PlayerController } from "../core/use-player";

const SPREAD = 0.58;
const SLOP = 8;
const SKELETON = [0, 1, 2];

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const project = (velocity: number) => ((velocity / 1000) * 0.99) / (1 - 0.99);
const rubber = (over: number) => (over * 0.55) / (1 + 0.55 * over);
const unrubber = (over: number) => over / (0.55 * (1 - Math.min(over, 0.99)));

function band(p: number, last: number, curve = rubber) {
  if (p < 0) return -curve(-p);
  return p > last ? last + curve(p - last) : p;
}

function place(card: HTMLElement, offset: number) {
  const distance = Math.abs(offset);
  const depth = Math.min(distance, 2);
  const opacity = Math.max(0, Math.min(1, (2.5 - distance) * 2));
  card.style.transform = `translateX(${offset * SPREAD * 100}%) scale(${1 - depth * 0.16})`;
  card.style.zIndex = String(Math.round(100 - distance * 10));
  card.style.opacity = String(opacity);
  card.style.visibility = opacity > 0 ? "" : "hidden";
  (card.lastElementChild as HTMLElement).style.opacity = String(depth * 0.25);
}

type Gesture = {
  id: number;
  x: number;
  y: number;
  from: number;
  step: number;
  tap: number | null;
  moved: boolean;
  samples: { x: number; t: number }[];
};

type CoverProps = {
  id?: string;
  index: number;
  active: boolean;
  ref: Ref<HTMLDivElement>;
};

function Cover({ id, index, active, ref }: CoverProps) {
  const [art, setArt] = useState<Artwork>();

  useEffect(() => {
    if (!id) return;
    let live = true;
    void loadArtwork(id).then((source) => {
      if (live) setArt(source);
    });
    return () => {
      live = false;
    };
  }, [id]);

  return (
    <div
      ref={ref}
      className="ytm-cover"
      data-index={index}
      data-active={active || undefined}
    >
      {id && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art?.src ?? thumbnail(id)}
          data-letterboxed={art?.letterboxed || undefined}
          crossOrigin="anonymous"
          alt=""
          draggable={false}
          onLoad={(event) => {
            event.currentTarget.dataset.loaded = "";
          }}
        />
      )}
      <span className="ytm-cover-shade" />
    </div>
  );
}

export function Coverflow({ player }: { player: PlayerController }) {
  const { ids, index, direction, actions } = player;
  const count = ids.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<number, HTMLElement>());
  const nearest = useRef(0);
  const target = useRef(0);
  const gesture = useRef<Gesture | null>(null);
  const instant = useRef(false);
  const [center, setCenter] = useState(0);
  const [spring] = useState(() =>
    createSpring((p) => {
      cards.current.forEach((card, i) => place(card, i - p));
      if (Math.round(p) === nearest.current) return;
      nearest.current = Math.round(p);
      setCenter(nearest.current);
    }),
  );

  useEffect(() => () => spring.stop(), [spring]);

  useEffect(() => {
    if (index === target.current) return;
    target.current = index;
    if (gesture.current) return;
    if (instant.current) {
      spring.jump(index);
    } else if (reduced()) {
      spring.jump(index);
      rootRef.current?.animate({ opacity: [0, 1] }, { duration: 180, easing: "ease" });
    } else {
      if (Math.abs(index - spring.value()) > 2) {
        spring.jump(index + (direction === "prev" ? 1 : -1));
      }
      spring.set(index);
    }
  }, [direction, index, spring]);

  const settle = (next: number, velocity?: number) => {
    target.current = next;
    if (reduced()) spring.jump(next);
    else spring.set(next, velocity);
  };

  const select = (next: number) => {
    settle(next);
    actions.playAt(next);
  };

  const cancel = () => {
    gesture.current = null;
    settle(target.current);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current || event.button !== 0 || !count) return;
    const settling = Math.abs(spring.value() - target.current) > 0.01;
    const card = (event.target as Element).closest<HTMLElement>("[data-index]");
    spring.stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: band(spring.value(), count - 1, unrubber),
      step: event.currentTarget.offsetHeight * SPREAD,
      tap: card && !settling ? Number(card.dataset.index) : null,
      moved: false,
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      return cancel();
    }
    drag.moved ||= Math.abs(dx) > SLOP;
    drag.samples = [...drag.samples.slice(-4), { x: event.clientX, t: event.timeStamp }];
    spring.jump(band(drag.from - dx / drag.step, count - 1));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag || event.pointerId !== drag.id) return;
    gesture.current = null;
    if (!drag.moved && drag.tap !== null) return select(drag.tap);

    const samples = [...drag.samples, { x: event.clientX, t: event.timeStamp }].filter(
      (sample) => event.timeStamp - sample.t < 100,
    );
    const first = samples[0];
    const end = samples[samples.length - 1];
    const velocity = end.t > first.t ? ((end.x - first.x) / (end.t - first.t)) * 1000 : 0;
    const last = count - 1;
    const raw = drag.from - (event.clientX - drag.x) / drag.step;
    const projected = Math.round(raw - project(velocity) / drag.step);
    const next = Math.max(0, Math.min(last, projected));
    const over = raw < 0 ? -raw : Math.max(0, raw - last);
    const resistance = over > 0 ? 0.55 / (1 + 0.55 * over) ** 2 : 1;
    settle(next, (-velocity / drag.step) * resistance);
    if (next !== index) actions.playAt(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action =
      event.key === "ArrowLeft"
        ? actions.previous
        : event.key === "ArrowRight"
          ? actions.next
          : event.key === " "
            ? actions.toggle
            : null;
    if (!action) return;
    event.preventDefault();
    instant.current = true;
    action();
    window.setTimeout(() => {
      instant.current = false;
    });
  };

  const from = Math.max(0, center - 3);
  const to = Math.min(count - 1, center + 3);
  const slots = count
    ? Array.from({ length: to - from + 1 }, (_, offset) => from + offset)
    : SKELETON;

  return (
    <div
      ref={rootRef}
      className="ytm-coverflow"
      role="group"
      aria-roledescription="carousel"
      aria-label="Tracks"
      aria-keyshortcuts="ArrowLeft ArrowRight"
      tabIndex={count ? 0 : -1}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={(event) => {
        if (gesture.current?.id === event.pointerId) cancel();
      }}
      onKeyDown={handleKeyDown}
    >
      {slots.map((i) => (
        <Cover
          key={`${i}:${ids[i] ?? ""}`}
          id={ids[i]}
          index={i}
          active={count > 0 && i === index}
          ref={(node: HTMLDivElement | null) => {
            if (!node) return;
            cards.current.set(i, node);
            place(node, i - spring.value());
            return () => {
              cards.current.delete(i);
            };
          }}
        />
      ))}
    </div>
  );
}
