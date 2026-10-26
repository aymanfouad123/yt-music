import { animate, type MotionValue } from "motion";

type DiscValues = { angle: MotionValue<number>; opacity: MotionValue<number> };
export type DiscTiming = {
  align: number;
  fade: number;
  settleEase: [number, number, number, number];
  ease: [number, number, number, number];
};
type ArtworkChange = { ready: Promise<unknown>; commit: () => Promise<void> };

/** One sequence owns the old face, its orientation, the swap, and spin restart. */
export function animateDisc(
  { angle, opacity }: DiscValues,
  playing: boolean,
  reducedMotion: boolean,
  timing: DiscTiming,
  change?: ArtworkChange,
) {
  let cancelled = false;
  angle.stop();
  opacity.stop();
  angle.set(((angle.get() % 360) + 360) % 360);

  const run = async () => {
    if (reducedMotion) {
      angle.set(0);
      opacity.set(1);
      if (change) {
        await change.ready;
        if (!cancelled) await change.commit();
      }
      return;
    }
    if (change) {
      const current = angle.get();
      const target = current <= 180 ? 0 : 360;
      const distance = Math.abs(target - current);
      // Decode in parallel with settling. Keep the old face visible if loading
      // takes longer; neither a blank disc nor a rotated incoming image flashes.
      await Promise.all([
        change.ready,
        distance > 0.1
          ? animate(angle, target, { duration: timing.align * (0.5 + 0.5 * distance / 180), ease: timing.settleEase })
          : Promise.resolve(),
      ]);
      if (cancelled) return;
      angle.set(0);
      await animate(opacity, 0, { duration: opacity.get() === 0 ? 0 : timing.fade, ease: timing.ease });
      if (cancelled) return;
      await change.commit();
      if (cancelled) return;
    }
    // Reveal while upright; rotation starts only after the incoming face lands.
    await animate(opacity, 1, { duration: opacity.get() === 1 ? 0 : timing.fade, ease: timing.ease });
    if (cancelled || !playing) return;
    const start = angle.get();
    animate(angle, start + 360, { duration: 12, ease: "linear", repeat: Infinity });
  };
  void run();
  return () => {
    cancelled = true;
    angle.stop();
    opacity.stop();
  };
}
