import assert from "node:assert/strict";
import { test } from "node:test";

// Exercise real Motion animations in Node, without launching a browser.
// Import after installing the frame clock because Motion captures it on load.
globalThis.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 8);
globalThis.cancelAnimationFrame = clearTimeout;
const { motionValue } = await import("motion");
const { animateSleeve, cssTimeInSeconds } = await import("../src/core/sleeve-motion.ts");
const timing = { travel: 0.05, settle: 0.12, unfold: 0.06, ease: [0.23, 1, 0.32, 1], returnEase: [0.77, 0, 0.175, 1], settleEase: [0.32, 0.72, 0, 1] };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const values = (angle, open = 1) => ({ angle: motionValue(angle), open: motionValue(open), roundness: motionValue(open), spinning: motionValue(false) });

test("CSS durations survive development and production unit formats", () => {
  for (const value of ["280ms", ".28s", "0.28s", " 280ms "]) {
    assert.equal(cssTimeInSeconds(value, 1), 0.28);
  }
  assert.equal(cssTimeInSeconds("240ms", 1), 0.24);
  assert.equal(cssTimeInSeconds(".24s", 1), 0.24);
  assert.equal(cssTimeInSeconds("", 0.28), 0.28);
});

test("closing descends while aligning, then unfolds only upright artwork", async () => {
  for (const initial of [0, 45, 179, 180, 181, 270, 350, 725]) {
    const state = values(initial);
    const turns = [];
    const upright = initial % 360;
    let loweringWhileRotating = false;
    let squareWhileRotating = false;
    state.angle.on("change", angle => turns.push(angle));
    state.roundness.on("change", roundness => {
      if (roundness < 1 && Math.abs(state.angle.get() % 360) > 0.001) squareWhileRotating = true;
    });
    state.open.on("change", open => {
      if (open < 1 && open > 0 && state.angle.get() !== 0) loweringWhileRotating = true;
    });
    const stop = animateSleeve(state, false, false, timing);
    try {
      await wait(230);
      assert.equal(state.angle.get(), 0, `upright from ${initial}°`);
      assert.equal(state.open.get(), 0, `closed from ${initial}°`);
      assert.equal(state.roundness.get(), 0, `square from ${initial}°`);
      assert.equal(state.spinning.get(), false);
      assert.equal(squareWhileRotating, false, "a rotated image never exposes square corners");
      if (upright !== 0) {
        assert.equal(loweringWhileRotating, true, "closing does not wait for alignment");
      }
      if (initial === 45) assert.ok(turns.some(angle => angle > 0 && angle < 45));
      if (initial === 350) assert.ok(turns.some(angle => angle > 350 && angle <= 360));
    } finally { stop(); }
  }
});

test("spin starts after the lift and stops immediately on cleanup", async () => {
  const state = values(0, 0);
  const stop = animateSleeve(state, true, false, timing);
  try {
    assert.equal(state.spinning.get(), false);
    await wait(120);
    assert.equal(state.open.get(), 1);
    assert.equal(state.spinning.get(), true);
    const firstAngle = state.angle.get();
    await wait(80);
    assert.ok(state.angle.get() > firstAngle, "the CD actually rotates after lifting");
  } finally { stop(); }
  assert.equal(state.spinning.get(), false);
  const stoppedAngle = state.angle.get();
  await wait(80);
  assert.equal(state.angle.get(), stoppedAngle, "cleanup stops rotation immediately");
});

test("resuming a rotating return preserves its presentation and cancels the old close", async () => {
  const state = values(170);
  const pause = animateSleeve(state, false, false, timing);
  await wait(25);
  pause();
  const currentAngle = state.angle.get();
  const currentOpen = state.open.get();
  const currentRoundness = state.roundness.get();
  const resume = animateSleeve(state, true, false, timing);
  try {
    assert.equal(state.angle.get(), currentAngle, "rotation does not jump on reversal");
    assert.equal(state.open.get(), currentOpen, "lift reverses from its current position");
    assert.equal(state.roundness.get(), currentRoundness, "shape does not jump on reversal");
    assert.equal(state.spinning.get(), true, "interrupted rotation continues during reopening");
    await wait(250);
    assert.equal(state.open.get(), 1);
    assert.equal(state.roundness.get(), 1);
    assert.equal(state.spinning.get(), true);
  } finally { resume(); }
});

test("resuming during lowering reverses the lift before spinning", async () => {
  const state = values(0);
  const pause = animateSleeve(state, false, false, timing);
  await wait(25);
  pause();
  const resume = animateSleeve(state, true, false, timing);
  try {
    await wait(180);
    assert.equal(state.open.get(), 1);
    assert.equal(state.spinning.get(), true);
  } finally { resume(); }
});

test("reduced motion uses upright static artwork", () => {
  const state = values(225);
  const stop = animateSleeve(state, true, true, timing);
  assert.equal(state.open.get(), 1);
  assert.equal(state.roundness.get(), 1);
  assert.equal(state.angle.get(), 0);
  assert.equal(state.spinning.get(), false);
  stop();
});

test("reduced motion also closes immediately without a rotating face", () => {
  const state = values(225);
  const stop = animateSleeve(state, false, true, timing);
  assert.equal(state.open.get(), 0);
  assert.equal(state.roundness.get(), 0);
  assert.equal(state.angle.get(), 0);
  assert.equal(state.spinning.get(), false);
  stop();
});
