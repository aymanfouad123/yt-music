import { animate, type MotionValue } from "motion";

export type SleeveValues = {
  open: MotionValue<number>;
  roundness: MotionValue<number>;
  angle: MotionValue<number>;
  spinning: MotionValue<boolean>;
};
/** CSS minifiers freely convert ms to s. Motion always expects seconds. */
export function cssTimeInSeconds(value: string, fallback: number) {
  const time = Number.parseFloat(value);
  if (!Number.isFinite(time)) return fallback;
  return value.trim().endsWith("ms") ? time / 1000 : time;
}

export type SleeveTiming = {
  travel: number;
  settle: number;
  unfold: number;
  ease: [number, number, number, number];
  returnEase: [number, number, number, number];
  settleEase: [number, number, number, number];
};

/** One owner for both values. A cancelled sequence can never start its next phase. */
export function animateSleeve(
  { open, roundness, angle, spinning }: SleeveValues,
  playing: boolean,
  reducedMotion: boolean,
  timing: SleeveTiming,
) {
  let cancelled = false;
  spinning.set(false);
  open.stop();
  roundness.stop();
  angle.stop();
  angle.set(((angle.get() % 360) + 360) % 360);

  const startRotation = () => {
    if (spinning.get()) return;
    const start = angle.get();
    animate(angle, start + 360, { duration: 12, ease: "linear", repeat: Infinity });
    spinning.set(true);
  };

  const run = async () => {
    if (reducedMotion) {
      angle.set(0);
      open.set(playing ? 1 : 0);
      roundness.set(playing ? 1 : 0);
      return;
    }

    if (playing) {
      // An interrupted return keeps its angular motion. A fresh poster waits
      // until it is circular before starting to spin.
      if (open.get() > 0 && angle.get() !== 0) startRotation();
      await Promise.all([
        animate(open, 1, { duration: timing.travel, ease: timing.ease }),
        animate(roundness, 1, { duration: timing.travel, ease: timing.ease }),
      ]);
      if (cancelled) return;
      startRotation();
      return;
    }

    const current = angle.get();
    const target = current <= 180 ? 0 : 360;
    const distance = Math.abs(target - current);
    if (distance > 0.1) {
      // One face, two coordinated motions: descend immediately, stay circular
      // while the art settles, then unfold the corners during the final descent.
      const alignDuration = timing.settle * (0.5 + 0.5 * distance / 180);
      const lowering = animate(open, 0, {
        duration: Math.max(timing.travel, alignDuration + timing.unfold),
        ease: timing.returnEase,
      });
      await animate(angle, target, { duration: alignDuration, ease: timing.settleEase });
      if (cancelled) return;
      angle.set(0);
      await Promise.all([
        lowering,
        animate(roundness, 0, { duration: timing.unfold, ease: timing.settleEase }),
      ]);
    } else {
      // Before spinning starts, a second click simply reverses the opening.
      angle.set(0);
      await Promise.all([
        animate(open, 0, { duration: timing.travel, ease: timing.ease }),
        animate(roundness, 0, { duration: timing.travel, ease: timing.ease }),
      ]);
    }
  };

  void run();
  return () => {
    cancelled = true;
    spinning.set(false);
    open.stop();
    roundness.stop();
    angle.stop();
  };
}
