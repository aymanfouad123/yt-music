# YouTube Music Player

Customizable React players for public YouTube and YouTube Music playlists,
built for embedding music on personal sites. Playback runs through YouTube's
IFrame Player API, with shared controls and several visual styles.

Currently a work in progress: a Next.js playground for developing the components
before publishing them as a standalone React package.

*Unofficial project. Not affiliated with YouTube or Google.*

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
/>
```

Accepts YouTube Music or YouTube playlist links, or a bare playlist ID.
The `ytm-player` alias resolves to local source; the package is not published yet.

| Variant | Description |
| --- | --- |
| `pill` (default) | Small capsule; `wide` adds navigation, `showProgress` enables seeking |
| `card` | Rounded player; `compact` switches to a horizontal layout |
| `playlist` | Player with a scrollable track list |
| `showcase` | Draggable artwork carousel |
| `disc` | Spinning artwork CD |
| `sleeve` | Cover that lifts into a spinning CD |

Themes: `gradient` (default, follows the artwork), `dark`, and `light`.
Disc and Sleeve use a neutral presentation and are also exported as controlled
`DiscPlayer` and `SleevePlayer` components for use with another audio engine.

## Development

Player source lives in `packages/player/src`; the playground lives in `app`.

```bash
pnpm lint
pnpm exec tsc --noEmit -p packages/player/tsconfig.json
pnpm build
```
