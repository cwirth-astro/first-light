// Today's events from Google Calendar "Secret address in iCal format" feeds.
// A feed URL needs no OAuth client or chrome.identity, so it works the same in
// every browser. Google sends no CORS headers: the built extension fetches it
// with an optional host permission and the dev server proxies it (vite.config.ts).

const GOOGLE_ORIGIN = "https://calendar.google.com";
// Requested when a calendar is connected (optional_host_permissions in the manifest).
export const CALENDAR_PERMISSION = `${GOOGLE_ORIGIN}/*`;

export interface AgendaEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
}

// Accepts webcal:// links too, which some "subscribe" buttons hand out.
export function normalizeCalendarUrl(input: string): string | null {
  try {
    const url = new URL(input.trim().replace(/^webcal:/i, "https:"));
    return url.origin === GOOGLE_ORIGIN && url.pathname.endsWith(".ics") ? url.href : null;
  } catch {
    return null;
  }
}

function requestUrl(feed: string) {
  return import.meta.env.DEV ? feed.replace(GOOGLE_ORIGIN, "/gcal") : feed;
}

export async function fetchAgenda(feeds: string[], day: Date): Promise<AgendaEvent[]> {
  // ical.js is only needed once a calendar is connected, so load it on demand.
  const { default: ICAL } = await import("ical.js");

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const texts = await Promise.all(
    feeds.map(async (feed) => {
      const res = await fetch(requestUrl(feed));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    }),
  );

  const events: AgendaEvent[] = [];
  for (const text of texts) {
    const calendar = new ICAL.Component(ICAL.parse(text));
    for (const tz of calendar.getAllSubcomponents("vtimezone")) {
      ICAL.TimezoneService.register(new ICAL.Timezone(tz));
    }

    const all = calendar.getAllSubcomponents("vevent").map((v) => new ICAL.Event(v));
    // Edited occurrences of a recurring event arrive as separate VEVENTs with a
    // RECURRENCE-ID; attach them to their series so the iterator uses them.
    const series = new Map(all.filter((e) => !e.isRecurrenceException()).map((e) => [e.uid, e]));
    for (const exception of all.filter((e) => e.isRecurrenceException())) {
      series.get(exception.uid)?.relateException(exception);
    }

    const add = (event: InstanceType<typeof ICAL.Event>, start: InstanceType<typeof ICAL.Time>, end: InstanceType<typeof ICAL.Time>) => {
      if (event.component.getFirstPropertyValue("status") === "CANCELLED") return;
      const s = start.toJSDate();
      const e = end.toJSDate();
      if (e <= dayStart || s >= dayEnd) return;
      events.push({
        id: `${event.uid}:${s.getTime()}`,
        title: event.summary || "(No title)",
        start: s.toISOString(),
        end: e.toISOString(),
        allDay: start.isDate,
        location: event.location || null,
      });
    };

    for (const event of series.values()) {
      if (!event.isRecurring()) {
        add(event, event.startDate, event.endDate ?? event.startDate);
        continue;
      }
      const iterator = event.iterator();
      for (let next = iterator.next(); next && next.toJSDate() < dayEnd; next = iterator.next()) {
        const occurrence = event.getOccurrenceDetails(next);
        add(occurrence.item, occurrence.startDate, occurrence.endDate);
      }
    }
  }

  return events.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
}
