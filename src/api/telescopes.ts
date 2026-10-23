export type Telescope = "webb" | "hubble";

export const TELESCOPE_NAMES: Record<Telescope, string> = {
  webb: "James Webb Space Telescope",
  hubble: "Hubble Space Telescope",
};

export interface Observation {
  telescope: Telescope;
  id: string;
  title: string;
  proposalId: string | null;
  category: string | null;
  instruments: string[];
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

// Webb and Hubble responses differ in field names; map both to one shape.
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
    title: p.title ?? "Untitled program",
    proposalId: p.proposalID ?? null,
    category: p.scientificCategory?.title ?? null,
    instruments: (p.instruments ?? []).map((i: any) => i.title).filter(Boolean),
    pi: p.primaryInvestigator?.formalName || null,
    target: target || "Unknown target",
    start: (isWebb ? d.scheduledStartTime : d.predictedStartTime) ?? null,
    end: (isWebb ? d.scheduledEndTime : d.predictedEndTime) ?? null,
    ra: toNumber(isWebb ? d.boreSightRightAscensionInDegrees : d.targetRightAscensionInDegrees),
    dec: toNumber(isWebb ? d.boreSightDeclinationInDegrees : d.targetDeclinationInDegrees),
    nextStart: body._pagination?.nextRecord?.startTime ?? null,
    url: `${SITE}/${telescope}?obsId=${d.id}`,
  };
}

// Hubble target names look like "ANY,COLUMBA-I"; drop the qualifier prefix.
function cleanHubbleTarget(name: string | undefined): string | undefined {
  return name?.replace(/^ANY,/, "").replace(/-/g, " ");
}

function toNumber(v: unknown): number | null {
  const n = Number(v);
  return v == null || Number.isNaN(n) ? null : n;
}
