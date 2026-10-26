import assert from "node:assert/strict";
import test from "node:test";
import { getLaunchConfig } from "../apps/storefront/src/config/launch.js";
import { getTimeRemaining } from "../apps/storefront/src/features/launch-countdown/getTimeRemaining.js";
import { createLaunchClock } from "../apps/storefront/src/features/launch-countdown/launchClock.js";
import { validatePublicEnvironment } from "./public-environment.js";

const target = Date.UTC(2026, 10, 8, 7, 0, 0);

test("launch defaults to 8 AM Lagos, the same absolute instant as 7 AM UTC", () => {
  assert.equal(getLaunchConfig().targetMs, target);
  assert.equal(getLaunchConfig().launchAt, "2026-11-08T08:00:00+01:00");
  assert.equal(getLaunchConfig().label, "Sunday, 8 November 2026 · 8:00 AM (West African Time)");
});

test("launch config safely falls back for invalid, missing, impossible and timezone-less values", () => {
  for (const value of [undefined, null, 123, "", "  ", "invalid", "2026-11-08", "2026-11-08T08:00:00", "2026-02-30T08:00:00+01:00", "2026-13-08T08:00:00Z", "2026-11-31T08:00:00Z", "2026-11-08T25:00:00Z", "2026-11-08T08:00:00+25:00"]) {
    assert.equal(getLaunchConfig({ VITE_LAUNCH_AT: value }).targetMs, target, String(value));
  }
});

test("launch config accepts absolute overrides and describes them in West African Time", () => {
  for (const value of ["2027-01-02T11:30:00Z", "2027-01-02T12:30:00+01:00", "2027-01-02T06:30:00-05:00", " 2027-01-02T11:30:00.000Z "]) {
    const config = getLaunchConfig({ VITE_LAUNCH_AT: value });
    assert.equal(config.targetMs, Date.UTC(2027, 0, 2, 11, 30));
    assert.equal(config.label, "Saturday, 2 January 2027 · 12:30 PM (West African Time)");
  }
  assert.equal(getLaunchConfig({ VITE_LAUNCH_AT: "2028-02-29T08:00+01:00" }).targetMs, Date.UTC(2028, 1, 29, 7));
});

test("launch override crosses the existing browser environment allowlist", () => {
  const env = { VITE_LAUNCH_AT: "2027-01-02T11:30:00Z" };
  assert.equal(validatePublicEnvironment(env).VITE_LAUNCH_AT, env.VITE_LAUNCH_AT);
});

test("countdown splits several days into four units", () => {
  const totalMs = (12 * 86400 + 4 * 3600 + 33 * 60 + 9) * 1000;
  assert.deepEqual(getTimeRemaining(target, target - totalMs), { days: 12, hours: 4, minutes: 33, seconds: 9, totalMs, isComplete: false });
});

test("countdown handles exactly one day, hour, minute and second", () => {
  for (const [key, totalMs] of [["days", 86400000], ["hours", 3600000], ["minutes", 60000], ["seconds", 1000]]) {
    assert.deepEqual(getTimeRemaining(target, target - totalMs), { days: 0, hours: 0, minutes: 0, seconds: 0, [key]: 1, totalMs, isComplete: false });
  }
});

test("countdown never renders all zeros before the final millisecond", () => {
  assert.deepEqual(getTimeRemaining(target, target - 1), { days: 0, hours: 0, minutes: 0, seconds: 1, totalMs: 1, isComplete: false });
});

test("countdown is complete with only zeros at and after launch", () => {
  for (const now of [target, target + 1, target + 864000000]) {
    assert.deepEqual(getTimeRemaining(target, now), { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isComplete: true });
  }
});

test("clock aligns ticks, recovers background time, stops at launch and cleans up", (t) => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const timers = new Map();
  const events = new Map();
  let nextId = 0;
  let now = target - 10250;
  t.mock.method(Date, "now", () => now);
  globalThis.window = {
    setTimeout: (callback, delay) => { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
  };
  globalThis.document = {
    hidden: false,
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: (name) => events.delete(name),
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });

  const clock = createLaunchClock(target);
  assert.equal(clock.getServerSnapshot(), null);
  assert.equal(clock.getSnapshot(), clock.getSnapshot(), "React snapshots stay cached between ticks");
  const unsubscribe = clock.subscribe(() => {});
  assert.equal([...timers.values()][0].delay, 250);
  now = target - 3000;
  events.get("visibilitychange")();
  assert.equal(clock.getSnapshot().seconds, 3, "visibility recovery uses the wall clock");
  assert.equal(timers.size, 1, "resync replaces the pending tick");
  now = target;
  [...timers.values()][0].callback();
  assert.equal(clock.getSnapshot().isComplete, true);
  assert.equal(timers.size, 0);
  assert.equal(events.size, 0);
  unsubscribe();

  const alreadyLive = createLaunchClock(target);
  const stopLive = alreadyLive.subscribe(() => {});
  assert.equal(alreadyLive.getSnapshot().isComplete, true);
  assert.equal(timers.size, 0);
  assert.equal(events.size, 0);
  stopLive();

  now = target - 10000;
  const active = createLaunchClock(target);
  const cleanup = active.subscribe(() => {});
  assert.equal(timers.size, 1);
  cleanup();
  assert.equal(timers.size, 0);
  assert.equal(events.size, 0);
  const strictModeCleanup = active.subscribe(() => {});
  assert.equal(timers.size, 1, "StrictMode can safely resubscribe");
  strictModeCleanup();
});
