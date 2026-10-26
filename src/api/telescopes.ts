export type Telescope = "webb" | "hubble";

export const TELESCOPE_NAMES: Record<Telescope, string> = {
  webb: "James Webb Space Telescope",
  hubble: "Hubble Space Telescope",
};

export interface Instrument {
  name: string;
  title: string;
}

export interface Observation {
  telescope: Telescope;
  id: string;
  title: string;
  proposalId: string | null;
  category: string | null;
  instruments: Instrument[];
  pi: string | null;
  target: string;
  start: string | null;
  end: string | null;
  ra: number | null;
  dec: number | null;
  nextStart: string | null;
  url: string;
}

const SITE = "https://spacetelescopelive.org";
// In dev the Vite server proxies /api; the built extension calls the site directly.
const API_BASE = import.meta.env.DEV ? "" : SITE;

export async function fetchCurrent(telescope: Telescope): Promise<Observation> {
  const res = await fetch(`${API_BASE}/api/get/${telescope}`, {
    headers: { endpoint: "current" },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const body = await res.json();
  if (!body?.data) throw new Error("No observation returned");
  return normalize(telescope, body);
}

// JWST and Hubble responses differ in field names; map both to one shape.
function normalize(telescope: Telescope, body: any): Observation {
  const d = body.data;
  const p = d.proposal ?? {};
  const isWebb = telescope === "webb";
  const firstTarget = d.targets?.[0];

  const target = isWebb
    ? firstTarget?.standardName || firstTarget?.name
    : cleanHubbleTarget(d.targetName);

  return {
    telescope,
    id: d.id,
    title: fixMinus(p.title) ?? "Untitled program",
    proposalId: p.proposalID ?? null,
    category: p.scientificCategory?.title ?? null,
    instruments: (p.instruments ?? []).filter((i: any) => i.title).map((i: any) => ({
      name: INSTRUMENT_NAMES[i.code] ?? i.title,
      title: i.title,
    })),
    pi: p.primaryInvestigator?.formalName || null,
    target: fixMinus(target) || "Unknown target",
    start: (isWebb ? d.scheduledStartTime : d.predictedStartTime) ?? null,
    end: (isWebb ? d.scheduledEndTime : d.predictedEndTime) ?? null,
    ra: toNumber(isWebb ? d.boreSightRightAscensionInDegrees : d.targetRightAscensionInDegrees),
    dec: toNumber(isWebb ? d.boreSightDeclinationInDegrees : d.targetDeclinationInDegrees),
    nextStart: body._pagination?.nextRecord?.startTime ?? null,
    url: `${SITE}/${telescope}?obsId=${d.id}`,
  };
}

// The API's instrument codes are all caps; show them the way the missions write them.
const INSTRUMENT_NAMES: Record<string, string> = {
  NIRCAM: "NIRCam",
  NIRSPEC: "NIRSpec",
  MIRI: "MIRI",
  NIRISS: "NIRISS",
  FGS: "FGS",
  WFC3: "WFC3",
  ACS: "ACS",
  COS: "COS",
  STIS: "STIS",
};

// Hubble target names look like "ANY,COLUMBA-I"; drop the qualifier prefix.
// Strips scheduling prefixes: "ANY,COLUMBA-I" and SIMBAD's "NAME HUBBLE-ULTRA-DEEP-FIELD".
function cleanHubbleTarget(name: string | undefined): string | undefined {
  return name?.replace(/^ANY,/, "").replace(/^NAME[ -]/, "").replace(/-/g, " ");
}

// The upstream data has "?" where a minus sign was lost to an encoding error
// ("SNR 0509?67.5"); restore it between digits.
function fixMinus(text: string | undefined): string | undefined {
  return text?.replace(/(\d)\?(\d)/g, "$1−$2");
}

function toNumber(v: unknown): number | null {
  const n = Number(v);
  return v == null || Number.isNaN(n) ? null : n;
}
