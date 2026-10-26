import { X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { storefrontPaths } from "../../app/routePaths.js";
import { Container } from "../../components/layout/Container.jsx";
import { launchConfig } from "../../config/launch.js";
import { useLaunchCountdown } from "./useLaunchCountdown.js";
import "./launch-countdown.css";

const dismissalKey = `nuede:launch-announcement:${launchConfig.launchAt}`;

/** Returns this tab's dismissal preference, showing the bar if session storage is unavailable. */
function readDismissed() {
  try { return window.sessionStorage.getItem(dismissalKey) === "dismissed"; }
  catch { return false; }
}

/** Renders a dismissible homepage link on other routes; hides it when dismissed or already launched. */
export function LaunchAnnouncement() {
  const { pathname } = useLocation();
  return pathname === storefrontPaths.home ? null : <AnnouncementBar />;
}

/** Renders the prelaunch bar after hydration; storage failures still allow an in-memory dismissal. */
function AnnouncementBar() {
  const remaining = useLaunchCountdown();
  const [dismissed, setDismissed] = useState(readDismissed);

  /** Hides the announcement for this tab even when storage writes are blocked. */
  function dismiss() {
    setDismissed(true);
    try { window.sessionStorage.setItem(dismissalKey, "dismissed"); }
    catch { /* Dismissal still works for the current mounted layout. */ }
  }

  if (!remaining || remaining.isComplete || dismissed) return null;
  return <aside className="launch-announcement" aria-label="Official launch announcement">
    <Container className="flex items-center justify-between gap-3">
      <Link className="launch-announcement-link" to={`${storefrontPaths.home}#launch-countdown`}>Our official launch: {launchConfig.label}. View the countdown.</Link>
      <button className="launch-announcement-dismiss" type="button" onClick={dismiss} aria-label="Dismiss launch announcement"><X className="size-4" aria-hidden="true" /></button>
    </Container>
  </aside>;
}
