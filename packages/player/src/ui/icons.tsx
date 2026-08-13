import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M8 6.8q0-1.4 1.2-.68l8.7 5.2q1.2.68 0 1.36l-8.7 5.2Q8 18.6 8 17.2Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

export function PreviousIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="6.5" y="5.5" width="2" height="13" rx="1" fill="currentColor" />
      <path fill="currentColor" d="M17.5 7.5q0-1.5-1.2-.63l-6 4.3q-1.2.83 0 1.66l6 4.3q1.2.87 1.2-.63Z" />
    </svg>
  );
}

export function NextIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="15.5" y="5.5" width="2" height="13" rx="1" fill="currentColor" />
      <path fill="currentColor" d="M6.5 7.5q0-1.5 1.2-.63l6 4.3q1.2.83 0 1.66l-6 4.3q-1.2.87-1.2-.63Z" />
    </svg>
  );
}

export function YouTubeMusicMark(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" />
      <circle cx="12" cy="12" r="6.25" fill="none" stroke="currentColor" />
      <path fill="currentColor" d="m10.2 8.65 5.2 3.35-5.2 3.35v-6.7Z" />
    </svg>
  );
}
