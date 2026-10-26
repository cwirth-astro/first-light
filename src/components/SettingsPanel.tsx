import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CALENDAR_PERMISSION, normalizeCalendarUrl } from "../api/calendar";
import { TELESCOPE_NAMES, type Telescope } from "../api/telescopes";
import { useOriginPermission } from "../lib/permissions";
import { closeTopLayer, enhanceDialog } from "../lib/topLayer";
import { useSettings, type BackgroundMode, type ObservationDetails } from "../settings";

const BACKGROUNDS: { value: BackgroundMode; label: string; hint: string }[] = [
  { value: "apod", label: "APOD", hint: "NASA's Astronomy Picture of the Day" },
  { value: "shuffle", label: "Shuffle", hint: "A random JWST or Hubble image each tab" },
  { value: "stars", label: "Starfield", hint: "A simple starry gradient" },
];

const DETAILS: { key: keyof ObservationDetails; label: string }[] = [
  { key: "title", label: "Program title" },
  { key: "tags", label: "Category and instruments" },
  { key: "progress", label: "Progress bar" },
  { key: "pi", label: "Principal investigator" },
  { key: "program", label: "Program number" },
  { key: "coordinates", label: "Sky coordinates (RA / Dec)" },
  { key: "upNext", label: "Next observation time" },
];

const DIALOG_ID = "settings";
const PRIVACY_URL = "https://github.com/cwirth-astro/first-light/blob/main/PRIVACY.md";

// Newer HTML attributes that React 18's types don't know yet. Invoker commands
// fall back to a click handler where unsupported (see SettingsButton).
const lightDismiss = { closedby: "any" } as object;
const openSettings = { commandfor: DIALOG_ID, command: "show-modal" } as object;

export function SettingsPanel() {
  const [settings, update] = useSettings();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => enhanceDialog(dialogRef.current!), []);

  return (
    <dialog ref={dialogRef} id={DIALOG_ID} className="settings" aria-labelledby="settings-title" {...lightDismiss}>
      <header className="settings__header">
        <h2 id="settings-title">Settings</h2>
        {/* Closes through closeTopLayer (not command="close") so the exit animates in every browser */}
        <button className="icon-button" aria-label="Close settings" onClick={() => closeTopLayer(dialogRef.current!)}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <Section title="Background">
        <div className="segmented" role="radiogroup" aria-label="Background">
          {BACKGROUNDS.map((b) => (
            <label key={b.value} className="segmented__option" title={b.hint}>
              <input
                type="radio"
                name="background"
                value={b.value}
                checked={settings.background === b.value}
                onChange={() => update((s) => ({ ...s, background: b.value }))}
              />
              <span>{b.label}</span>
            </label>
          ))}
        </div>
        <p className="settings__hint">{BACKGROUNDS.find((b) => b.value === settings.background)?.hint}</p>
      </Section>

      <Section title="Telescopes">
        {(Object.keys(TELESCOPE_NAMES) as Telescope[]).map((t) => (
          <Toggle
            key={t}
            label={TELESCOPE_NAMES[t]}
            checked={settings.telescopes[t]}
            onChange={(on) => update((s) => ({ ...s, telescopes: { ...s.telescopes, [t]: on } }))}
          />
        ))}
        <Toggle
          label="Rubin Observatory (LSST)"
          checked={settings.showRubin}
          onChange={(on) => update((s) => ({ ...s, showRubin: on }))}
        />
      </Section>

      <Section title="Observation details">
        {DETAILS.map((d) => (
          <Toggle
            key={d.key}
            label={d.label}
            checked={settings.details[d.key]}
            onChange={(on) => update((s) => ({ ...s, details: { ...s.details, [d.key]: on } }))}
          />
        ))}
      </Section>

      <Section title="Widgets">
        <Toggle
          label="To-do list"
          checked={settings.showTodos}
          onChange={(on) => update((s) => ({ ...s, showTodos: on }))}
        />
        <Toggle
          label="Google Calendar"
          checked={settings.showCalendar}
          onChange={(on) => update((s) => ({ ...s, showCalendar: on }))}
        />
        {settings.showCalendar && (
          <CalendarUrls urls={settings.calendarUrls} onChange={(urls) => update((s) => ({ ...s, calendarUrls: urls }))} />
        )}
      </Section>

      <footer className="settings__footer">
        <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
          Privacy policy
        </a>
      </footer>
    </dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings__section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

// One secret iCal address per line. Valid lines are saved as you type; the
// draft keeps whatever you typed so a half-pasted URL isn't wiped out.
function CalendarUrls({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const [draft, setDraft] = useState(() => urls.join("\n"));
  const [allowed, allow] = useOriginPermission(CALENDAR_PERMISSION);
  const prompted = useRef(false);
  const id = useId();

  const lines = draft.split("\n").map((l) => l.trim()).filter(Boolean);
  const invalid = lines.filter((l) => !normalizeCalendarUrl(l)).length;

  const change = (value: string) => {
    setDraft(value);
    const valid = value.split("\n").flatMap((l) => normalizeCalendarUrl(l) ?? []);
    onChange([...new Set(valid)]);
    // Pasting counts as a user gesture, so the prompt can show right away.
    // Ask once; after a dismissed prompt the button below asks again.
    if (valid.length > 0 && allowed === false && !prompted.current) {
      prompted.current = true;
      allow();
    }
  };

  return (
    <div className="calendar-urls">
      <label htmlFor={id}>Secret iCal addresses, one per line</label>
      <textarea
        id={id}
        rows={2}
        value={draft}
        onChange={(e) => change(e.target.value)}
        placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid > 0}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="settings__hint">
        {invalid > 0
          ? `${invalid === 1 ? "That doesn't look" : `${invalid} lines don't look`} like a Google Calendar iCal address.`
          : "In Google Calendar, open Settings, pick a calendar, and copy “Secret address in iCal format” from Integrate calendar. Keep it private: anyone with it can read that calendar."}
      </p>
      {urls.length > 0 && allowed === false && (
        <button className="pill-button" onClick={allow}>
          Allow access to Google Calendar
        </button>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

const supportsInvokers = "commandForElement" in HTMLButtonElement.prototype;

export function SettingsButton() {
  // Browsers without invoker commands ignore command/commandfor, so open the
  // dialog from the click instead. (A small handler rather than the
  // invokers-polyfill, whose `new Function` use store reviews tend to flag.)
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement | null)?.showModal();

  return (
    <button
      className="icon-button settings-button"
      aria-label="Settings"
      title="Settings"
      {...openSettings}
      onClick={supportsInvokers ? undefined : open}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </g>
      </svg>
    </button>
  );
}
