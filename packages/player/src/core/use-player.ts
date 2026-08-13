"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadArtwork } from "./artwork";
import { cleanMetadata, prefetchMeta, type TrackMeta } from "./metadata";
import {
  loadYouTubeApi,
  PLAYER_STATE,
  type YouTubePlayer,
} from "./youtube-api";

export type PlayerStatus =
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export type Direction = "next" | "prev" | null;

export type Track = { videoId: string; title?: string; artist?: string };

export type ProgressClock = {
  now(): number;
  duration(): number;
  subscribe(listener: () => void): () => void;
};

type ClockState = { time: number; duration: number; playing: boolean };

function createClock() {
  let state: ClockState = { time: 0, duration: 0, playing: false };
  let stamp = 0;
  const listeners = new Set<() => void>();

  const now = () => {
    const elapsed = state.playing ? (performance.now() - stamp) / 1000 : 0;
    const time = state.time + elapsed;
    return state.duration > 0 ? Math.min(time, state.duration) : time;
  };

  return {
    now,
    duration: () => state.duration,
    set(next: Partial<ClockState>) {
      state = { ...state, time: now(), ...next };
      stamp = performance.now();
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const durations = new Map<string, number>();
const activePlayers = new Set<YouTubePlayer>();
const SKIPPABLE_ERRORS = new Set([100, 101, 150]);

export function knownDuration(id: string) {
  return durations.get(id);
}

export function useYouTubePlayer(
  playlistId: string | null,
  mountRef: React.RefObject<HTMLDivElement | null>,
) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const clock = useMemo(createClock, []);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(null);
  const [duration, setDuration] = useState(0);
  const [meta, setMeta] = useState<ReadonlyMap<string, TrackMeta>>(
    () => new Map(),
  );
  const live = useRef({
    ids: [] as string[],
    index: 0,
    pending: null as { index: number; at: number } | null,
    playing: false,
    status: "loading" as PlayerStatus,
    revert: 0,
  });

  const setPlayingIntent = useCallback((playing: boolean) => {
    live.current.playing = playing;
    setIsPlaying(playing);
  }, []);

  const requestPlay = useCallback(
    (player: YouTubePlayer) => {
      activePlayers.forEach((other) => other !== player && other.pauseVideo());
      setPlayingIntent(true);
      window.clearTimeout(live.current.revert);
      // Autoplay policies can silently refuse playback; don't leave a pause icon lying.
      live.current.revert = window.setTimeout(() => {
        const { status } = live.current;
        if (status !== "playing" && status !== "buffering") {
          setPlayingIntent(false);
        }
      }, 2500);
    },
    [setPlayingIntent],
  );

  const moveTo = useCallback(
    (target: number, nextDirection: Direction) => {
      const state = live.current;
      const known = durations.get(state.ids[target]) ?? 0;
      state.index = target;
      state.pending = { index: target, at: performance.now() };
      setIndex(target);
      setDirection(nextDirection);
      setDuration(known);
      clock.set({ time: 0, duration: known, playing: false });
    },
    [clock],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!playlistId || !mount) {
      setStatus("error");
      return;
    }

    let disposed = false;
    let bufferTimer = 0;
    let skipped = 0;
    const state = live.current;
    const host = document.createElement("div");
    mount.replaceChildren(host);

    const updateStatus = (next: PlayerStatus) => {
      state.status = next;
      setStatus(next);
    };

    const sync = (player: YouTubePlayer) => {
      const list = player.getPlaylist?.() ?? [];
      if (list.length && list.join() !== state.ids.join()) {
        state.ids = list;
        setIds(list);
      }

      const reported = player.getPlaylistIndex?.() ?? -1;
      const pending = state.pending;
      if (pending && performance.now() - pending.at > 5000) state.pending = null;
      if (state.pending) {
        if (reported === state.pending.index) state.pending = null;
      } else if (reported >= 0 && reported !== state.index) {
        setDirection(
          reported === (state.index + 1) % Math.max(list.length, 1) ||
            reported > state.index
            ? "next"
            : "prev",
        );
        state.index = reported;
        setIndex(reported);
      }

      const data = player.getVideoData();
      const id = data.video_id;
      if (id && data.title && data.author) {
        setMeta((current) =>
          current.has(id)
            ? current
            : new Map(current).set(id, cleanMetadata(data.title, data.author)),
        );
      }
      const length = player.getDuration();
      if (id && length > 0 && id === state.ids[state.index]) {
        durations.set(id, length);
        setDuration(length);
        clock.set({ duration: length });
      }
    };

    updateStatus("loading");
    setIds([]);
    state.ids = [];
    state.index = 0;

    void loadYouTubeApi()
      .then((YT) => {
        if (disposed) return;
        const player = new YT.Player(host, {
          width: 200,
          height: 200,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            origin: window.location.origin,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady() {
              if (disposed) return;
              player.cuePlaylist({ listType: "playlist", list: playlistId, index: 0 });
            },
            onStateChange({ data }) {
              if (disposed) return;
              window.clearTimeout(bufferTimer);
              if (data !== PLAYER_STATE.buffering) setIsBuffering(false);
              sync(player);

              if (data === PLAYER_STATE.playing) {
                skipped = 0;
                window.clearTimeout(state.revert);
                activePlayers.forEach((other) => other !== player && other.pauseVideo());
                updateStatus("playing");
                setPlayingIntent(true);
                clock.set({ time: player.getCurrentTime(), playing: true });
              } else if (data === PLAYER_STATE.paused) {
                updateStatus("paused");
                setPlayingIntent(false);
                clock.set({ time: player.getCurrentTime(), playing: false });
              } else if (data === PLAYER_STATE.buffering) {
                updateStatus("buffering");
                clock.set({ playing: false });
                bufferTimer = window.setTimeout(() => setIsBuffering(true), 400);
              } else if (data === PLAYER_STATE.ended) {
                updateStatus("ended");
                clock.set({ playing: false });
                if (state.index >= state.ids.length - 1) setPlayingIntent(false);
              } else if (data === PLAYER_STATE.cued) {
                updateStatus("ready");
                clock.set({ time: 0, playing: false });
              }
            },
            onError({ data }) {
              if (disposed) return;
              if (SKIPPABLE_ERRORS.has(data) && skipped < 5) {
                skipped += 1;
                player.nextVideo();
                return;
              }
              updateStatus("error");
            },
          },
        });
        playerRef.current = player;
        activePlayers.add(player);
      })
      .catch(() => {
        if (!disposed) updateStatus("error");
      });

    return () => {
      disposed = true;
      window.clearTimeout(bufferTimer);
      window.clearTimeout(state.revert);
      const player = playerRef.current;
      if (player) {
        activePlayers.delete(player);
        player.destroy();
      }
      playerRef.current = null;
      mount.replaceChildren();
    };
  }, [clock, mountRef, playlistId, setPlayingIntent]);

  useEffect(() => {
    if (status !== "playing") return;
    const poll = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || document.hidden) return;
      const actual = player.getCurrentTime();
      if (Math.abs(actual - clock.now()) > 0.3) clock.set({ time: actual });
    }, 500);
    return () => window.clearInterval(poll);
  }, [clock, status]);

  useEffect(() => {
    if (!ids.length) return;
    const queue: [string, TrackMeta][] = [];
    let flush = 0;
    const cancel = prefetchMeta(ids, live.current.index, (id, value) => {
      queue.push([id, value]);
      flush ||= window.setTimeout(() => {
        flush = 0;
        const batch = queue.splice(0);
        setMeta((current) => {
          const next = new Map(current);
          batch.forEach(([key, item]) => next.set(key, item));
          return next;
        });
      }, 60);
    });
    return () => {
      cancel();
      window.clearTimeout(flush);
    };
  }, [ids]);

  useEffect(() => {
    if (ids.length < 2) return;
    void loadArtwork(ids[(index + 1) % ids.length]);
    void loadArtwork(ids[(index - 1 + ids.length) % ids.length]);
  }, [ids, index]);

  const go = useCallback(
    (target: number, nextDirection: Direction) => {
      const player = playerRef.current;
      const state = live.current;
      const count = state.ids.length;
      if (!player || !count || !playlistId) return;
      const wrapped = (target + count) % count;

      if (wrapped === state.index) {
        player.seekTo(0, true);
        clock.set({ time: 0 });
        return;
      }
      moveTo(wrapped, nextDirection);
      if (state.playing) {
        requestPlay(player);
        player.playVideoAt(wrapped);
      } else {
        player.cuePlaylist({ listType: "playlist", list: playlistId, index: wrapped });
      }
    },
    [clock, moveTo, playlistId, requestPlay],
  );

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player || !live.current.ids.length) return;
    if (live.current.playing) {
      setPlayingIntent(false);
      player.pauseVideo();
    } else {
      requestPlay(player);
      player.playVideo();
    }
  }, [requestPlay, setPlayingIntent]);

  const next = useCallback(() => go(live.current.index + 1, "next"), [go]);

  const previous = useCallback(() => {
    if (clock.now() > 3) {
      playerRef.current?.seekTo(0, true);
      clock.set({ time: 0 });
      return;
    }
    go(live.current.index - 1, "prev");
  }, [clock, go]);

  const playAt = useCallback(
    (target: number) => {
      const player = playerRef.current;
      const state = live.current;
      if (!player || target === state.index) return toggle();
      moveTo(target, target > state.index ? "next" : "prev");
      requestPlay(player);
      player.playVideoAt(target);
    },
    [moveTo, requestPlay, toggle],
  );

  const seek = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player) return;
      const length = clock.duration() || player.getDuration();
      const time = Math.max(0, Math.min(seconds, length));
      if (live.current.status === "ready") requestPlay(player);
      player.seekTo(time, true);
      clock.set({ time });
    },
    [clock, requestPlay],
  );

  const currentId = ids[index];
  const currentMeta = currentId ? meta.get(currentId) : undefined;
  const track = useMemo<Track | null>(
    () => (currentId ? { videoId: currentId, ...currentMeta } : null),
    [currentId, currentMeta],
  );

  return {
    status,
    isPlaying,
    isBuffering,
    isLoading: status !== "error" && (status === "loading" || !ids.length),
    ids,
    index,
    track,
    meta,
    direction,
    duration,
    clock: clock as ProgressClock,
    actions: { toggle, next, previous, playAt, seek },
  };
}

export type PlayerController = ReturnType<typeof useYouTubePlayer>;
