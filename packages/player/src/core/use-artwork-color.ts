"use client";

import { useEffect, useState } from "react";
import { loadArtwork } from "./artwork";

const FALLBACK = "rgb(28 32 42)";
const colors = new Map<string, string>();

function luminance(red: number, green: number, blue: number) {
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return (
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  );
}

function ensureTextContrast(red: number, green: number, blue: number) {
  let color = [red, green, blue].map(Math.round);
  const contrast = () => {
    // Conservative brightest surface: gradient highlight plus active-row overlay.
    const surface = color.map((channel) => channel * 0.85 + 255 * 0.15);
    const text = surface.map((channel) => channel * 0.38 + 255 * 0.62);
    return (luminance(text[0], text[1], text[2]) + 0.05) /
      (luminance(surface[0], surface[1], surface[2]) + 0.05);
  };
  while (contrast() < 4.5) {
    color = color.map((channel) => Math.floor(channel * 0.94));
  }
  return `rgb(${color.join(" ")})`;
}

/** Dominant saturated hue of the artwork, falling back to the mean for greyscale art. */
function sample(image: HTMLImageElement) {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return FALLBACK;

  // Centre crop: the outer frame is often letterboxing or video chrome.
  const { naturalWidth: width, naturalHeight: height } = image;
  const side = Math.min(width, height) * 0.7;
  context.drawImage(
    image,
    (width - side) / 2,
    (height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  const pixels = context.getImageData(0, 0, size, size).data;
  const bins = Array.from({ length: 12 }, () => [0, 0, 0, 0]);
  const mean = [0, 0, 0, 0];

  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 510;
    if (lightness < 0.05 || lightness > 0.95) continue;
    mean[0] += r;
    mean[1] += g;
    mean[2] += b;
    mean[3] += 1;

    const chroma = max - min;
    if (chroma < 24) continue;
    const saturation = chroma / (255 - Math.abs(max + min - 255));
    let hue =
      max === r
        ? (g - b) / chroma
        : max === g
          ? (b - r) / chroma + 2
          : (r - g) / chroma + 4;
    hue = ((hue * 60 + 360) % 360) / 30;
    const weight = saturation * (1 - Math.abs(lightness - 0.5) * 1.6);
    const bin = bins[Math.floor(hue) % 12];
    bin[0] += r * weight;
    bin[1] += g * weight;
    bin[2] += b * weight;
    bin[3] += weight;
  }

  const heaviest = bins.reduce((best, bin) => (bin[3] > best[3] ? bin : best));
  if (heaviest[3] > 6) {
    const [r, g, b, weight] = heaviest;
    return ensureTextContrast(r / weight, g / weight, b / weight);
  }
  if (mean[3] > 0) {
    return ensureTextContrast(mean[0] / mean[3], mean[1] / mean[3], mean[2] / mean[3]);
  }
  return FALLBACK;
}

export function useArtworkColor(id?: string) {
  const [color, setColor] = useState(FALLBACK);

  const cached = id ? colors.get(id) : undefined;

  useEffect(() => {
    if (!id || colors.has(id)) return;

    let cancelled = false;
    void loadArtwork(id).then(({ src }) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (cancelled) return;
        try {
          const value = sample(image);
          colors.set(id, value);
          setColor(value);
        } catch {
          setColor(FALLBACK);
        }
      };
      image.onerror = () => {
        if (!cancelled) setColor(FALLBACK);
      };
      image.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return cached ?? color;
}
