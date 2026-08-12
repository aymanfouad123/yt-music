export type TrackMeta = { title: string; artist: string };

const NOISE =
  /\s*[([]\s*(?:official|lyrics?|audio|video|visuali[sz]er|music video|performance|live session|hd|4k|remaster(?:ed)?|explicit)[^)\]]*[)\]]/gi;

function loose(value: string) {
  return value
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function cleanArtist(author = "") {
  return (
    author
      .replace(/\s+-\s+Topic$/i, "")
      .replace(/VEVO$/i, "")
      .replace(/\s*(?:Official)$/i, "")
      .trim() || "YouTube Music"
  );
}

export function cleanMetadata(rawTitle = "", rawAuthor = ""): TrackMeta {
  let artist = cleanArtist(rawAuthor);
  let title = rawTitle.replace(NOISE, "").trim();
  const split = title.match(/^(.+?)\s[-–—]\s(.+)$/);

  if (split) {
    const [, left, right] = split;
    const leftKey = loose(left);
    const rightKey = loose(right);
    const artistKey = loose(artist);
    if (
      leftKey.startsWith(artistKey) ||
      artistKey.startsWith(leftKey) ||
      rawAuthor.endsWith("VEVO")
    ) {
      artist = left.trim();
      title = right.trim();
    } else if (artistKey && rightKey.startsWith(artistKey)) {
      artist = right.trim();
      title = left.trim();
    }
  }

  return { title: title || "Untitled", artist };
}

const cache = new Map<string, Promise<TrackMeta | null>>();

export function fetchMeta(id: string): Promise<TrackMeta | null> {
  let request = cache.get(id);
  if (!request) {
    const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
    request = fetch(`https://www.youtube.com/oembed?url=${watch}&format=json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) =>
        data ? cleanMetadata(data.title, data.author_name) : null,
      )
      .catch(() => {
        cache.delete(id);
        return null;
      });
    cache.set(id, request);
  }
  return request;
}

/** Fetches metadata outward from `start` (start, +1, -1, +2, …), four at a time. */
export function prefetchMeta(
  ids: string[],
  start: number,
  onMeta: (id: string, meta: TrackMeta) => void,
) {
  let cancelled = false;
  const order: string[] = [];
  for (let step = 0; start + step < ids.length || start - step >= 0; step += 1) {
    if (start + step < ids.length) order.push(ids[start + step]);
    if (step > 0 && start - step >= 0) order.push(ids[start - step]);
  }

  const worker = async () => {
    while (!cancelled && order.length) {
      const id = order.shift()!;
      const meta = await fetchMeta(id);
      if (meta && !cancelled) onMeta(id, meta);
    }
  };
  for (let i = 0; i < 4; i += 1) void worker();

  return () => {
    cancelled = true;
  };
}
