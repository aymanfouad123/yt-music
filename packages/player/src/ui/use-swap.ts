"use client";

import { useEffect, useState } from "react";
import type { Direction } from "../core/use-player";

export type Layer<T> = {
  key: string;
  value: T;
  state: "enter" | "active" | "exit";
  direction: Direction;
};

/**
 * Keeps at most two layers (incoming + outgoing) so CSS transitions can run between
 * values. Rapid changes drop the oldest outgoing layer instead of stacking.
 */
export function useSwap<T>(
  key: string | undefined,
  value: T,
  direction: Direction,
  exitMs = 400,
) {
  const [current, setCurrent] = useState<{ key?: string; value?: T }>({});
  const [layers, setLayers] = useState<Layer<T>[]>([]);

  if (key !== current.key) {
    setCurrent({ key, value });
    setLayers((previous) => {
      const outgoing = previous.find((layer) => layer.key === current.key);
      const exit: Layer<T>[] = outgoing
        ? [{ ...outgoing, state: "exit", direction }]
        : [];
      return key === undefined
        ? exit
        : [...exit, { key, value, state: "enter", direction }];
    });
  } else if (value !== current.value) {
    setCurrent({ key, value });
    setLayers((previous) =>
      previous.map((layer) => (layer.key === key ? { ...layer, value } : layer)),
    );
  }

  const entering = layers.some((layer) => layer.state === "enter");
  useEffect(() => {
    if (!entering) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        setLayers((current) =>
          current.map((layer) =>
            layer.state === "enter" ? { ...layer, state: "active" } : layer,
          ),
        ),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [entering]);

  const exiting = layers.find((layer) => layer.state === "exit")?.key;
  useEffect(() => {
    if (exiting === undefined) return;
    const timer = window.setTimeout(
      () => setLayers((current) => current.filter((l) => l.key !== exiting)),
      exitMs,
    );
    return () => window.clearTimeout(timer);
  }, [exiting, exitMs]);

  return layers;
}
