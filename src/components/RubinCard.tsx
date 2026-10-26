import { RUBIN_ALL_SKY_URL, RUBIN_SKYMAP_URL } from "../api/rubin";
import { isObserving, useRubin } from "../hooks/useRubin";
import { formatTime, useMinuteTick } from "../lib/time";
import { useSettings } from "../settings";

// Rubin has no single target, so the card shows the latest visit and how the
// night is going, laid out like the JWST and Hubble cards.
export function RubinCard() {
  const { night, error, loading } = useRubin();
  const now = useMinuteTick();
  const [{ details: show }] = useSettings();

  const observing = isObserving(night, now);
  const latest = night?.latest;

  return (
    <article className="scope scope--rubin" aria-label="Rubin Observatory survey">
      <header className="scope__header">
        <span className="scope__name">
          <span className={`scope__dot${observing ? "" : " is-idle"}`} aria-hidden />
          Rubin
        </span>
        {night && <span className="scope__remaining">{observing ? "observing now" : nightLabel(night.firstVisit, now)}</span>}
      </header>

      {!night && loading && <p className="scope__status">Checking the survey…</p>}
      {!night && !loading && !error && <p className="scope__status">No visits in the last three days.</p>}
      {!night && error && <p className="scope__status">Couldn't load the survey: {error}</p>}

      {night && latest && (
        <>
          <h2 className="scope__target">
            <a href={RUBIN_SKYMAP_URL}>{latest.field}</a>
          </h2>
          {show.title && (
            <p className="scope__title">
              {observing ? "Surveying the southern sky for" : "Latest visit of"} the Legacy Survey of Space and Time
            </p>
          )}

          {show.tags && (
            <p className="scope__tags">
              <span>{latest.survey}</span>
              <abbr title="Rubin's 3.2-gigapixel camera">LSSTCam</abbr>
              {latest.band && <span>{latest.band} band</span>}
            </p>
          )}

          <dl className="scope__meta">
            <div>
              <dt>Visits</dt>
              <dd>{night.visits.toLocaleString()}</dd>
            </div>
            {night.bands.length > 0 && (
              <div>
                <dt>Filters</dt>
                <dd>{night.bands.join(" ")}</dd>
              </div>
            )}
            {show.coordinates && (
              <div>
                <dt>RA/Dec</dt>
                <dd>
                  {latest.ra.toFixed(3)}° {latest.dec >= 0 ? "+" : "−"}
                  {Math.abs(latest.dec).toFixed(3)}°
                </dd>
              </div>
            )}
            <div>
              <dt>Latest</dt>
              <dd>{formatTime(latest.time)}</dd>
            </div>
          </dl>

          <a className="scope__link" href={RUBIN_ALL_SKY_URL}>
            Live sky over Cerro Pachón
          </a>

          {error && <p className="scope__stale">Showing cached data. Latest refresh failed.</p>}
        </>
      )}
    </article>
  );
}

function nightLabel(firstVisit: string, now: number) {
  const date = new Date(firstVisit);
  const days = Math.round((startOfDay(now) - startOfDay(date.getTime())) / 86_400_000);
  if (days <= 1) return "last night";
  return `night of ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
