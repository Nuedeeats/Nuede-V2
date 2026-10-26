import { useMemo, useSyncExternalStore } from "react";
import { launchConfig } from "../../config/launch.js";
import { createLaunchClock } from "./launchClock.js";

/** Returns live remaining time (completed immediately after launch), or null during prerender hydration. */
export function useLaunchCountdown() {
  const clock = useMemo(() => createLaunchClock(launchConfig.targetMs), []);
  return useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);
}
