export type Artwork = { src: string; letterboxed: boolean };

const SOURCES = [
  ["maxresdefault", false],
  ["sddefault", true],
  ["hqdefault", true],
] as const;

const cache = new Map<string, Promise<Artwork>>();

export function thumbnail(id: string, size = "mqdefault") {
  return `https://i.ytimg.com/vi/${id}/${size}.jpg`;
}

async function decode(src: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.src = src;
  await image.decode();
  // YouTube answers missing sizes with a 120×90 placeholder instead of a 404.
  if (image.naturalWidth <= 120) throw new Error("placeholder");
}

/** Resolves the sharpest available artwork once it is decoded and ready to paint. */
export function loadArtwork(id: string): Promise<Artwork> {
  let request = cache.get(id);
  if (!request) {
    request = (async () => {
      for (const [size, letterboxed] of SOURCES) {
        const src = thumbnail(id, size);
        try {
          await decode(src);
          return { src, letterboxed };
        } catch {}
      }
      return { src: thumbnail(id, "hqdefault"), letterboxed: true };
    })();
    cache.set(id, request);
  }
  return request;
}
