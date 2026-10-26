// An explicit UTC+1 offset keeps every visitor on the same Lagos launch instant.
const defaultLaunchAt = "2026-11-08T08:00:00+01:00";
const absoluteIso = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

/** Returns an absolute launch timestamp; missing, local-time or invalid env values use the official date. */
export function getLaunchConfig(env = {}) {
  const value = typeof env.VITE_LAUNCH_AT === "string" ? env.VITE_LAUNCH_AT.trim() : "";
  const match = absoluteIso.exec(value);
  let launchAt = defaultLaunchAt;
  if (match) {
    const [, year, month, day] = match;
    // Date.parse normalizes impossible dates such as February 30; reject those too.
    const calendarDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (Number.isFinite(Date.parse(value)) && Number.isFinite(calendarDate.getTime()) && calendarDate.toISOString().slice(0, 10) === `${year}-${month}-${day}`) launchAt = value;
  }
  const targetMs = Date.parse(launchAt);
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(targetMs);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", hour12: true }).format(targetMs);
  return { launchAt, targetMs, label: `${date} · ${time} (Lagos time)` };
}

export const launchConfig = getLaunchConfig(import.meta.env);
