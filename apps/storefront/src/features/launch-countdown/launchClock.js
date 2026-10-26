import { getTimeRemaining } from "./getTimeRemaining.js";

/** Creates a cached clock store; subscriptions own timers/listeners and already-passed launches never start them. */
export function createLaunchClock(targetMs) {
  let snapshot = getTimeRemaining(targetMs, Date.now());
  const listeners = new Set();
  let timer;

  /** Clears scheduled work and visibility recovery when unmounted or complete. */
  function stop() {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  /** Publishes wall-clock time and schedules the next second boundary, stopping at launch. */
  function tick() {
    window.clearTimeout(timer);
    // Recompute rather than decrement so suspended/background tabs cannot accumulate drift.
    const now = Date.now();
    snapshot = getTimeRemaining(targetMs, now);
    listeners.forEach((listener) => listener());
    if (snapshot.isComplete) stop();
    else timer = window.setTimeout(tick, Math.min(1000 - (now % 1000), snapshot.totalMs));
  }

  /** Immediately resynchronizes a returning tab; hidden tabs rely on their throttled timeout. */
  function onVisibilityChange() {
    if (!document.hidden) tick();
  }

  return {
    /** Returns the cached remaining time, including an all-zero completed state after launch. */
    getSnapshot: () => snapshot,
    /** Returns a stable prerender placeholder so build-time digits cannot cause a hydration mismatch. */
    getServerSnapshot: () => null,
    /** Subscribes to the clock and returns cleanup for the final listener. */
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        if (!snapshot.isComplete) document.addEventListener("visibilitychange", onVisibilityChange);
        tick();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) stop();
      };
    },
  };
}
