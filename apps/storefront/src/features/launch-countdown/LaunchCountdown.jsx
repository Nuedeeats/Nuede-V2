import { useId } from "react";
import { Container } from "../../components/layout/Container.jsx";
import { launchConfig } from "../../config/launch.js";
import { useLaunchCountdown } from "./useLaunchCountdown.js";
import "./launch-countdown.css";

const units = [["days", "Day"], ["hours", "Hour"], ["minutes", "Minute"], ["seconds", "Second"]];

/** Renders a reserved, non-live countdown below the hero, or a politely announced welcome once launched. */
export function LaunchCountdown() {
  const headingId = useId();
  const remaining = useLaunchCountdown();
  const complete = remaining?.isComplete;
  const summary = remaining && !complete ? `${remaining.days} ${remaining.days === 1 ? "day" : "days"} and ${remaining.hours} ${remaining.hours === 1 ? "hour" : "hours"} until launch` : "";

  return <section id="launch-countdown" className="launch-countdown" aria-labelledby={headingId}>
    <Container className="launch-countdown-layout">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">A date for your diary</p>
        <h2 id={headingId} className="launch-countdown-heading mt-3 font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{complete ? "Welcome to Nuede" : "Nuede officially launches in"}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{launchConfig.label}</p>
        <p className="sr-only">{summary}</p>
      </div>
      <div className="launch-countdown-display">
        <p className={complete ? "launch-welcome" : "sr-only"} aria-live="polite" aria-atomic="true">{complete ? "We're live! Welcome to Nuede." : ""}</p>
        {!complete ? <div className="launch-countdown-units" aria-hidden="true">{units.map(([key, label]) => <div key={key} className="launch-countdown-unit">
          <span className="launch-countdown-number">{remaining ? (key === "days" ? remaining[key] : String(remaining[key]).padStart(2, "0")) : "—"}</span>
          <span className="launch-countdown-label">{label}{remaining?.[key] === 1 ? "" : "s"}</span>
        </div>)}</div> : null}
      </div>
    </Container>
  </section>;
}
