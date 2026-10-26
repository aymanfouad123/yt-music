# YouTube Music Player

https://github.com/user-attachments/assets/012222ae-5e29-4d6c-9f08-637bc0f1fb7a

Customizable React players for public YouTube and YouTube Music playlists,
built for embedding music on personal sites. Playback runs through YouTube's
IFrame Player API, with shared controls and several visual styles.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000) to preview the players, load a public
playlist, adjust appearance, and copy component examples.

## Usage

```tsx
import { YouTubeMusicPlayer } from "ytm-player";

<YouTubeMusicPlayer
  url="https://music.youtube.com/playlist?list=YOUR_PLAYLIST_ID"
  variant="pill"
  theme="gradient"
/>;
```

Accepts YouTube Music or YouTube playlist links, or a bare playlist ID.
The `ytm-player` alias resolves to local source.

| Variant          | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `pill` (default) | Small capsule; `wide` adds navigation, `showProgress` enables seeking |
| `card`           | Rounded player; `compact` switches to a horizontal layout             |
| `playlist`       | Player with a scrollable track list                                   |
| `showcase`       | Draggable artwork carousel                                            |
| `disc`           | Spinning artwork CD                                                   |
| `sleeve`         | Cover that lifts into a spinning CD                                   |

Themes: `gradient` (default, follows the artwork), `dark`, and `light`.

## Development

Player source lives in `packages/player/src`; the playground lives in `app`.

```bash
pnpm lint
pnpm exec tsc --noEmit -p packages/player/tsconfig.json
pnpm build
```
