import { TELESCOPE_NAMES, TELESCOPE_PERMISSION, type Telescope } from "../api/telescopes";
import { useObservation } from "../hooks/useObservation";
import { useOriginPermission } from "../lib/permissions";
import { formatDuration, formatTime, useMinuteTick } from "../lib/time";
import { useSettings } from "../settings";

const SHORT_NAMES: Record<Telescope, string> = { webb: "JWST", hubble: "Hubble" };

export function TelescopeCard({ telescope }: { telescope: Telescope }) {
  const [allowed, allow] = useOriginPermission(TELESCOPE_PERMISSION);
  const { observation: obs, error, loading } = useObservation(telescope, allowed === true);
  const now = useMinuteTick();
  const [{ details: show }] = useSettings();

  const remaining = obs?.end ? new Date(obs.end).getTime() - now : null;

  return (
    <article className={`scope scope--${telescope}`} aria-label={`${TELESCOPE_NAMES[telescope]} observation`}>
      <header className="scope__header">
        <span className="scope__name">
          <span className="scope__dot" aria-hidden />
          {SHORT_NAMES[telescope]}
        </span>
        {remaining != null && (
          <span className="scope__remaining">{remaining > 0 ? `${formatDuration(remaining)} left` : "wrapping up"}</span>
        )}
      </header>

      {!obs && allowed === false && <AccessNeeded site="spacetelescopelive.org" onAllow={allow} />}
      {!obs && allowed && loading && <p className="scope__status">Acquiring target…</p>}
      {!obs && error && <p className="scope__status">Couldn't load observation: {error}</p>}

      {obs && (
        <>
          <h2 className="scope__target">
            <a href={obs.url}>{obs.target}</a>
          </h2>
          {show.title && <p className="scope__title">{obs.title}</p>}

          {show.tags && (obs.category || obs.instruments.length > 0) && (
            <p className="scope__tags">
              {obs.category && <span>{obs.category}</span>}
              {obs.instruments.map((i) => (
                <abbr key={i.name} title={i.title}>
                  {i.name}
                </abbr>
              ))}
            </p>
          )}

          {show.progress && <Progress start={obs.start} end={obs.end} now={now} />}

          <dl className="scope__meta">
            {show.pi && obs.pi && (
              <div>
                <dt>PI</dt>
                <dd>{obs.pi}</dd>
              </div>
            )}
            {show.program && obs.proposalId && (
              <div>
                <dt>Prog</dt>
                <dd>{obs.proposalId}</dd>
              </div>
            )}
            {show.coordinates && obs.ra != null && obs.dec != null && (
              <div>
                <dt>RA/Dec</dt>
                <dd>
                  {obs.ra.toFixed(3)}° {obs.dec >= 0 ? "+" : "−"}
                  {Math.abs(obs.dec).toFixed(3)}°
                </dd>
              </div>
            )}
            {show.upNext && obs.nextStart && (
              <div>
                <dt>Next</dt>
                <dd>{formatTime(obs.nextStart)}</dd>
              </div>
            )}
          </dl>

          {error && <p className="scope__stale">Showing cached data. Latest refresh failed.</p>}
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

  return (
    <div className="scope__progress">
      <span>{formatTime(start)}</span>
      <div
        className="scope__bar"
        role="progressbar"
        aria-label="Observation progress"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="scope__fill" style={{ width: `${pct}%` }} />
      </div>
      <span>{formatTime(end)}</span>
    </div>
  );
}

// Shown when the browser hasn't granted access to a card's data source, which
// happens in Firefox if the user turns off the extension's site access.
export function AccessNeeded({ site, onAllow }: { site: string; onAllow: () => void }) {
  return (
    <p className="scope__status">
      First Light needs permission to read {site}.{" "}
      <button className="text-button" onClick={onAllow}>
        Allow access
      </button>
    </p>
  );
}
