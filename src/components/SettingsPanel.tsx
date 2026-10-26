import { useEffect, useRef, type ReactNode } from "react";
import { TELESCOPE_NAMES, type Telescope } from "../api/telescopes";
import { closeTopLayer, enhanceDialog } from "../lib/topLayer";
import { useSettings, type BackgroundMode, type ObservationDetails } from "../settings";

const BACKGROUNDS: { value: BackgroundMode; label: string; hint: string }[] = [
  { value: "apod", label: "APOD", hint: "NASA's Astronomy Picture of the Day" },
  { value: "shuffle", label: "Shuffle", hint: "A random Webb or Hubble image each tab" },
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

// Newer HTML attributes that React 18's types don't know yet. Invoker commands
// are polyfilled in main.tsx where unsupported.
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
      </Section>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsButton() {
  return (
    <button className="icon-button settings-button" aria-label="Settings" title="Settings" {...openSettings}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </g>
      </svg>
    </button>
  );
}
