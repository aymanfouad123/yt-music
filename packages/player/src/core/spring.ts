export type Spring = {
  set(target: number, velocity?: number): void;
  jump(value: number): void;
  stop(): void;
  value(): number;
};

const RESPONSE = 0.35;
const OMEGA = (2 * Math.PI) / RESPONSE;

/** Critically damped spring (damping 1.0, response 0.35s) stepped once per frame. */
export function createSpring(onUpdate: (value: number) => void): Spring {
  let x = 0;
  let v = 0;
  let target = 0;
  let frame = 0;
  let last = 0;

  const step = (now: number) => {
    const dt = Math.min(Math.max(now - last, 1), 1000 / 30) / 1000;
    last = now;
    v += (-OMEGA * OMEGA * (x - target) - 2 * OMEGA * v) * dt;
    x += v * dt;
    if (Math.abs(x - target) < 0.001 && Math.abs(v) < 0.001) {
      x = target;
      v = 0;
      frame = 0;
    } else {
      frame = requestAnimationFrame(step);
    }
    onUpdate(x);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    v = 0;
  };

  return {
    set(next, velocity = v) {
      target = next;
      v = velocity;
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    },
    jump(value) {
      stop();
      x = target = value;
      onUpdate(x);
    },
    stop,
    value: () => x,
  };
}
