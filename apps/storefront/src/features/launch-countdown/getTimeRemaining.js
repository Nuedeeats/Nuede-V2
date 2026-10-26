/** Returns nonnegative remaining units and milliseconds, or a completed all-zero result at/after launch. */
export function getTimeRemaining(targetMs, nowMs) {
  const totalMs = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.ceil(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds / 3600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
    totalMs,
    isComplete: totalMs === 0,
  };
}
