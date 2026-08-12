const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,}$/;

/**
 * Accepts a YouTube/YouTube Music playlist URL or a bare playlist ID.
 */
export function parsePlaylistUrl(value: string): string | null {
  const input = value.trim();

  if (PLAYLIST_ID.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    const isYouTube =
      url.hostname === "youtube.com" ||
      url.hostname.endsWith(".youtube.com") ||
      url.hostname === "youtu.be";

    if (!isYouTube) {
      return null;
    }

    const id = url.searchParams.get("list");
    return id && PLAYLIST_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}
