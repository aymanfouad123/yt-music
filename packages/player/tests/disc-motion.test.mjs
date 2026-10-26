import assert from "node:assert/strict";
import { test } from "node:test";

globalThis.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 8);
globalThis.cancelAnimationFrame = clearTimeout;
const { motionValue } = await import("motion");
const { animateDisc } = await import("../src/core/disc-motion.ts");
const timing = { align: 0.08, fade: 0.04, settleEase: [0.32, 0.72, 0, 1], ease: [0.23, 1, 0.32, 1] };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const values = angle => ({ angle: motionValue(angle), opacity: motionValue(1) });

test("next artwork commits upright and hidden, reveals upright, then starts a fresh spin", async () => {
  const state = values(155);
  let commits = 0;
  let turningWhileRevealing = false;
  state.opacity.on("change", opacity => {
    if (commits && opacity < 1 && state.angle.get() !== 0) turningWhileRevealing = true;
  });
  const stop = animateDisc(state, true, false, timing, {
    ready: Promise.resolve(),
    commit: async () => {
      assert.equal(state.angle.get(), 0);
      assert.equal(state.opacity.get(), 0);
      commits++;
    },
  });
  try {
    await wait(250);
    assert.equal(commits, 1);
    assert.equal(turningWhileRevealing, false);
    assert.equal(state.opacity.get(), 1);
    assert.ok(state.angle.get() > 0 && state.angle.get() < 10);
  } finally { stop(); }
});

test("slow artwork keeps the previous face visible and upright until decoded", async () => {
  const state = values(280);
  let ready;
  let commits = 0;
  const stop = animateDisc(state, false, false, timing, {
    ready: new Promise(resolve => { ready = resolve; }),
    commit: async () => { commits++; },
  });
  try {
    await wait(130);
    assert.equal(state.opacity.get(), 1);
    assert.equal(state.angle.get() % 360, 0);
    assert.equal(commits, 0);
    ready();
    await wait(130);
    assert.equal(commits, 1);
    assert.equal(state.angle.get(), 0, "paused changes remain upright");
    assert.equal(state.opacity.get(), 1);
  } finally { stop(); }
});

test("a rapid second skip prevents stale artwork and stale spin from committing", async () => {
  const state = values(170);
  let oldReady;
  let staleCommits = 0;
  let latestCommits = 0;
  const old = animateDisc(state, true, false, timing, {
    ready: new Promise(resolve => { oldReady = resolve; }),
    commit: async () => { staleCommits++; },
  });
  await wait(20);
  old();
  const latest = animateDisc(state, false, false, timing, {
    ready: Promise.resolve(),
    commit: async () => { latestCommits++; },
  });
  try {
    oldReady();
    await wait(250);
    assert.equal(staleCommits, 0);
    assert.equal(latestCommits, 1);
    assert.equal(state.angle.get(), 0);
  } finally { latest(); }
});

test("reduced motion swaps upright and never spins", async () => {
  const state = values(270);
  let commits = 0;
  const stop = animateDisc(state, true, true, timing, {
    ready: Promise.resolve(), commit: async () => { commits++; },
  });
  try {
    await wait(30);
    assert.equal(commits, 1);
    assert.equal(state.angle.get(), 0);
    assert.equal(state.opacity.get(), 1);
  } finally { stop(); }
});
