type PlayerStateEvent = { data: number };
type PlayerErrorEvent = { data: number };

export type YouTubePlayer = {
  cuePlaylist(options: {
    listType: "playlist";
    list: string;
    index: number;
  }): void;
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaylist(): string[];
  getPlaylistIndex(): number;
  getVideoData(): {
    video_id?: string;
    title?: string;
    author?: string;
  };
  nextVideo(): void;
  pauseVideo(): void;
  playVideo(): void;
  playVideoAt(index: number): void;
  previousVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      height: number;
      width: number;
      playerVars: Record<string, number | string>;
      events: {
        onReady(): void;
        onStateChange(event: PlayerStateEvent): void;
        onError(event: PlayerErrorEvent): void;
      };
    },
  ) => YouTubePlayer;
};

type YouTubeWindow = Window & {
  YT?: YouTubeNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

export const PLAYER_STATE = {
  unstarted: -1,
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
  cued: 5,
} as const;

let apiPromise: Promise<YouTubeNamespace> | undefined;

export function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const browserWindow = window as YouTubeWindow;

    if (browserWindow.YT?.Player) {
      resolve(browserWindow.YT);
      return;
    }

    const previousReady = browserWindow.onYouTubeIframeAPIReady;
    browserWindow.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (browserWindow.YT?.Player) resolve(browserWindow.YT);
      else reject(new Error("The YouTube player API did not initialize."));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = undefined;
      reject(new Error("The YouTube player API could not be loaded."));
    };
    document.head.append(script);
  });

  return apiPromise;
}
