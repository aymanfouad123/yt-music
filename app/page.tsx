"use client";

import { type FormEvent, useState } from "react";
import { parsePlaylistUrl, type Theme, type Variant, YouTubeMusicPlayer } from "ytm-player";
import styles from "./page.module.css";

const demoUrl = "https://music.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI";
const families = [
  { name: "card", title: "Card", note: "A familiar player for your site. Choose Compact for a thinner view." },
  { name: "pill", title: "Pill", note: "Add song progress and seeking, or choose Wide for track navigation." },
  { name: "playlist", title: "Playlist", note: "Your current track and the whole playlist, ready to browse." },
] as const;

function snippet(variant: Variant, theme: Theme, url: string, compact: boolean, wide: boolean, showProgress: boolean) {
  const props = [`url="${url}"`, `variant="${variant}"`, `theme="${theme}"`];
  if (variant === "card" && compact) props.push("compact");
  if (variant === "pill" && wide) props.push("wide");
  if (variant === "pill") props.push(showProgress ? "showProgress" : "showProgress={false}");
  return `<YouTubeMusicPlayer\n  ${props.join("\n  ")}\n/>`;
}

function CodeExample({ code, title }: { code: string; title: string }) {
  const [result, setResult] = useState<"" | "Copied" | "Copy failed. Select the code to copy it.">("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setResult("Copied");
    } catch {
      setResult("Copy failed. Select the code to copy it.");
    }
  };
  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHead}>
        <span>React</span>
        <button type="button" className={styles.copyButton} onClick={copy} aria-label={`Copy ${title} code`}>
          {result === "Copied" ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={styles.code}><code>{code}</code></pre>
      <span className={styles.copyStatus} role="status">{result}</span>
    </div>
  );
}

export default function Home() {
  const [draftUrl, setDraftUrl] = useState(demoUrl);
  const [playlistUrl, setPlaylistUrl] = useState(demoUrl);
  const [theme, setTheme] = useState<Theme>("gradient");
  const [compact, setCompact] = useState(false);
  const [wide, setWide] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [error, setError] = useState("");
  const [usingDemo, setUsingDemo] = useState(true);

  const loadPlaylist = (event: FormEvent) => {
    event.preventDefault();
    const id = parsePlaylistUrl(draftUrl);
    if (!id) {
      setError("Enter a YouTube Music or YouTube playlist URL, or a playlist ID.");
      return;
    }
    const url = `https://music.youtube.com/playlist?list=${id}`;
    setPlaylistUrl(url);
    setDraftUrl(url);
    setUsingDemo(false);
    setError("");
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>ytm-player / made for your website</p>
        <h1 className={styles.heading}>Good music.<br />A little more tangible.</h1>
        <p className={styles.lede}>Small players with a sense of touch. Made for personal sites, quiet corners, and songs worth sharing.</p>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.inputLabel} htmlFor="playlist-url">Your playlist</label>
        <form className={styles.urlForm} onSubmit={loadPlaylist}>
          <input id="playlist-url" className={styles.urlInput} value={draftUrl}
            onChange={(event) => { setDraftUrl(event.target.value); setError(""); }}
            placeholder="music.youtube.com/playlist?list=…" spellCheck={false}
            autoCapitalize="none" autoCorrect="off" aria-invalid={Boolean(error)}
            aria-describedby={error ? "playlist-error" : "playlist-help"} />
          <button className={styles.loadButton} type="submit">Load playlist</button>
        </form>
        {error && <p className={styles.error} id="playlist-error" role="alert">{error}</p>}
        <div className={styles.toolbarRow}>
          <p id="playlist-help" className={styles.helper} role="status">
            {usingDemo ? "Previewing a demo playlist" : "Your playlist is loaded in every component"}
          </p>
          <fieldset className={styles.themePicker}>
            <legend className={styles.inputLabel}>Appearance</legend>
            <div className={styles.segments}>
              {(["gradient", "dark", "light"] as const).map((option) => (
                <label className={styles.segment} key={option} data-active={theme === option}>
                  <input type="radio" name="theme" value={option} checked={theme === option} onChange={() => setTheme(option)} />
                  <span>{option === "gradient" ? "Gradient" : option === "dark" ? "Dark" : "Light"}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <p className={styles.helper}>Gradient follows the current thumbnail. Dark and Light keep a neutral surface.</p>
      </div>

      <main className={styles.gallery}>
        {families.map((family, index) => {
          const code = snippet(family.name, theme, playlistUrl, compact, wide, showProgress);
          return (
            <section className={styles.section} key={family.name} aria-labelledby={`family-${family.name}`}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionNumber}>0{index + 1}</span>
                <h2 className={styles.sectionTitle} id={`family-${family.name}`}>{family.title}</h2>
                {(family.name === "card" || family.name === "pill") && (
                  <label className={styles.layoutToggle}>
                    <input type="checkbox" checked={family.name === "card" ? compact : wide}
                      onChange={(event) => family.name === "card" ? setCompact(event.target.checked) : setWide(event.target.checked)} />
                    {family.name === "card" ? "Compact" : "Wide"}
                  </label>
                )}
                {family.name === "pill" && (
                  <label className={styles.layoutToggle}>
                    <input type="checkbox" checked={showProgress}
                      onChange={(event) => setShowProgress(event.target.checked)} />
                    Progress
                  </label>
                )}
                <p className={styles.sectionNote}>{family.note}</p>
              </div>
              <div className={styles.preview} data-theme={theme}>
                <div className={styles.frame}>
                  {family.name === "card" ? (
                    <YouTubeMusicPlayer key={playlistUrl} url={playlistUrl} variant="card" compact={compact} theme={theme} />
                  ) : family.name === "pill" ? (
                    <YouTubeMusicPlayer key={playlistUrl} url={playlistUrl} variant="pill" wide={wide} showProgress={showProgress} theme={theme} />
                  ) : (
                    <YouTubeMusicPlayer key={playlistUrl} url={playlistUrl} variant={family.name} theme={theme} />
                  )}
                </div>
              </div>
              <CodeExample key={code} code={code} title={family.title} />
            </section>
          );
        })}
      </main>
    </div>
  );
}
