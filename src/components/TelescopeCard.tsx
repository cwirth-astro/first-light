import { useEffect, useState } from "react";
import { TELESCOPE_NAMES, type Telescope } from "../api/telescopes";
import { useObservation } from "../hooks/useObservation";

export function TelescopeCard({ telescope }: { telescope: Telescope }) {
  const { observation: obs, error, loading } = useObservation(telescope);
  const now = useMinuteTick();

  return (
    <article className={`card card--${telescope}`}>
      <div className="card__eyebrow">
        <span className="card__dot" aria-hidden />
        {TELESCOPE_NAMES[telescope]} is observing
      </div>

      {!obs && loading && <p className="card__status">Loading…</p>}
      {!obs && error && <p className="card__status">Couldn't load observation: {error}</p>}

      {obs && (
        <>
          <h2 className="card__target">
            <a href={obs.url}>{obs.target}</a>
          </h2>
          <p className="card__title">{obs.title}</p>

          <ul className="card__chips">
            {obs.category && <li className="chip chip--category">{obs.category}</li>}
            {obs.instruments.map((i) => (
              <li className="chip" key={i}>
                {i}
              </li>
            ))}
          </ul>

          <Progress start={obs.start} end={obs.end} now={now} />

          <dl className="card__meta">
            {obs.pi && (
              <div>
                <dt>PI</dt>
                <dd>{obs.pi}</dd>
              </div>
            )}
            {obs.proposalId && (
              <div>
                <dt>Program</dt>
                <dd>{obs.proposalId}</dd>
              </div>
            )}
            {obs.ra != null && obs.dec != null && (
              <div>
                <dt>RA / Dec</dt>
                <dd>
                  {obs.ra.toFixed(3)}° / {obs.dec.toFixed(3)}°
                </dd>
              </div>
            )}
            {obs.nextStart && (
              <div>
                <dt>Up next</dt>
                <dd>{formatTime(obs.nextStart)}</dd>
              </div>
            )}
          </dl>

          {error && <p className="card__stale">Showing cached data. Latest refresh failed.</p>}
        </>
      )}
    </article>
  );
}

function Progress({ start, end, now }: { start: string | null; end: string | null; now: number }) {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
  const remaining = e - now;

  return (
    <div className="progress">
      <div className="progress__bar">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress__labels">
        <span>{formatTime(start)}</span>
        <span>{remaining > 0 ? `ends in ${formatDuration(remaining)}` : "wrapping up"}</span>
        <span>{formatTime(end)}</span>
      </div>
    </div>
  );
}

function useMinuteTick() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDuration(ms: number) {
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
