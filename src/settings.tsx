import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { Telescope } from "./api/telescopes";
import { useStoredState } from "./hooks/useStoredState";

export type BackgroundMode = "apod" | "stars" | "shuffle";

export interface ObservationDetails {
  title: boolean;
  tags: boolean;
  progress: boolean;
  pi: boolean;
  program: boolean;
  coordinates: boolean;
  upNext: boolean;
}

export interface Settings {
  background: BackgroundMode;
  telescopes: Record<Telescope, boolean>;
  details: ObservationDetails;
  showRubin: boolean;
  showTodos: boolean;
  showCalendar: boolean;
  // Google Calendar "Secret address in iCal format" URLs
  calendarUrls: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  background: "apod",
  telescopes: { webb: true, hubble: true },
  details: {
    title: true,
    tags: true,
    progress: true,
    pi: true,
    program: true,
    coordinates: true,
    upNext: true,
  },
  showRubin: true,
  showTodos: true,
  showCalendar: true,
  calendarUrls: [],
};

// Merge stored settings over defaults so settings added later get a value.
function normalize(stored: unknown): Settings {
  const s = (stored ?? {}) as Partial<Settings>;
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    telescopes: { ...DEFAULT_SETTINGS.telescopes, ...s.telescopes },
    details: { ...DEFAULT_SETTINGS.details, ...s.details },
  };
}

type SettingsContextValue = [Settings, (update: (prev: Settings) => Settings) => void];

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useStoredState("settings", DEFAULT_SETTINGS, normalize);
  const update = useCallback((fn: (prev: Settings) => Settings) => setSettings(fn), [setSettings]);
  return <SettingsContext.Provider value={[settings, update]}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside SettingsProvider");
  return value;
}
