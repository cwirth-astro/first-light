import { CALENDAR_PERMISSION, type AgendaEvent } from "../api/calendar";
import { useAgenda } from "../hooks/useAgenda";
import { useOriginPermission } from "../lib/permissions";
import { formatTime, useMinuteTick } from "../lib/time";

// The rest of today's Google Calendar events, above the to-do list.
export function Agenda({ feeds }: { feeds: string[] }) {
  const now = useMinuteTick();
  const [allowed, allow] = useOriginPermission(CALENDAR_PERMISSION);
  const { events, error } = useAgenda(feeds, now, allowed === true);

  const upcoming = events?.filter((e) => e.allDay || new Date(e.end).getTime() > now) ?? [];
  const timed = upcoming.filter((e) => !e.allDay).length;

  return (
    <section className="today__section agenda" aria-labelledby="agenda-title">
      <header className="panel__header">
        <h3 id="agenda-title">Calendar</h3>
        {events && <span className="panel__count">{timed ? `${timed} left` : "All done"}</span>}
      </header>

      {allowed === false && (
        <p className="panel__empty">
          The extension needs permission to read your calendar.{" "}
          <button className="text-button" onClick={allow}>
            Allow access
          </button>
        </p>
      )}
      {allowed && !events && !error && <p className="panel__empty">Loading events…</p>}
      {!events && error && <p className="panel__empty">Couldn't load your calendar: {error}</p>}
      {events && upcoming.length === 0 && <p className="panel__empty">Nothing else on the calendar today.</p>}

      {upcoming.length > 0 && (
        <ol className="agenda__list">
          {upcoming.map((event) => (
            <AgendaItem key={event.id} event={event} now={now} />
          ))}
        </ol>
      )}

      {events && error && <p className="panel__empty">Showing cached events. Latest refresh failed.</p>}
    </section>
  );
}

function AgendaItem({ event, now }: { event: AgendaEvent; now: number }) {
  const live = !event.allDay && new Date(event.start).getTime() <= now;

  return (
    <li className={`agenda__event${live ? " is-live" : ""}`}>
      <span className="agenda__time">
        {event.allDay ? "All day" : live ? "Now" : formatTime(event.start)}
      </span>
      <span className="agenda__details">
        <span className="agenda__title">{event.title}</span>
        {!event.allDay && (
          <span className="agenda__sub">
            {live ? `until ${formatTime(event.end)}` : `${formatTime(event.start)} – ${formatTime(event.end)}`}
            {event.location && ` · ${event.location}`}
          </span>
        )}
      </span>
    </li>
  );
}
