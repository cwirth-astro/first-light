// Rubin Observatory (LSST) visits from ObsLocTAP, Rubin's public service for
// the scheduler's forecast and what was actually observed. Rubin doesn't hold
// a target the way JWST and Hubble do: it takes a 30-second visit every ~40
// seconds while sweeping the southern sky, so this reports the latest visit and
// a summary of the night instead.
// Docs: https://rubinobservatory.org/for-scientists/rubin-101/live-status

const SITE = "https://usdf-rsp.slac.stanford.edu";
// The service sends no CORS headers; the dev server proxies it (vite.config.ts)
// and the built extension calls it directly via host_permissions.
const API_BASE = import.meta.env.DEV ? "" : SITE;

export const RUBIN_SKYMAP_URL = `${SITE}/obsloctap/skymap?start=now&time=12`;
export const RUBIN_ALL_SKY_URL = "https://storage.googleapis.com/epo_rubintv_data/all_sky_current/all_sky_current.jpg";

const COLUMNS = ["target_name", "s_ra", "s_dec", "t_min", "em_min"];
// Long enough to always include one whole night.
const LOOKBACK_DAYS = 3;
// Visits more than this far apart belong to different nights.
const NIGHT_GAP_DAYS = 0.5;

export type Band = "u" | "g" | "r" | "i" | "z" | "y";

export interface RubinVisit {
  time: string;
  field: string;
  survey: string;
  band: Band | null;
  ra: number;
  dec: number;
}

export interface RubinNight {
  latest: RubinVisit;
  firstVisit: string;
  visits: number;
  bands: Band[];
}

interface RawVisit {
  target_name: string;
  s_ra: number;
  s_dec: number;
  t_min: number;
  em_min: number;
}

const toMjd = (ms: number) => ms / 86_400_000 + 40587;
const fromMjd = (mjd: number) => new Date((mjd - 40587) * 86_400_000).toISOString();

// Lower edge of each LSSTCam filter, in nm.
const BANDS: [Band, number][] = [
  ["y", 920],
  ["z", 815],
  ["i", 690],
  ["r", 550],
  ["g", 400],
  ["u", 300],
];

function bandFor(emMinMeters: number): Band | null {
  const nm = emMinMeters * 1e9;
  return BANDS.find(([, edge]) => nm >= edge)?.[0] ?? null;
}

// Scheduler region tags, most specific first. A visit can carry several,
// e.g. "ddf_edfs_a, lowdust".
const FIELDS: [RegExp, string, string][] = [
  [/^ddf_edfs/, "Euclid Deep Field South", "Deep drilling field"],
  [/^ddf_ecdfs/, "Chandra Deep Field South", "Deep drilling field"],
  [/^ddf_elaiss1/, "ELAIS-S1", "Deep drilling field"],
  [/^ddf_xmm_lss/, "XMM-LSS", "Deep drilling field"],
  [/^ddf_cosmos/, "COSMOS", "Deep drilling field"],
  [/^ddf_/, "Deep drilling field", "Deep drilling field"],
  [/^LMC_SMC$/i, "Magellanic Clouds", "Wide survey"],
  [/^virgo/i, "Virgo Cluster", "Wide survey"],
  [/^bulgy$/, "Galactic bulge", "Wide survey"],
  [/^dusty_plane$/, "Galactic plane", "Wide survey"],
  [/^scp$/, "South celestial pole", "Wide survey"],
  [/^nes$/, "Northern ecliptic spur", "Wide survey"],
  [/^euclid_overlap$/, "Euclid overlap", "Wide survey"],
  [/^lowdust$/, "Wide-Fast-Deep sky", "Wide survey"],
];

function describeField(targetName: string): { field: string; survey: string } {
  const tags = targetName.split(",").map((t) => t.trim()).filter(Boolean);
  for (const [pattern, field, survey] of FIELDS) {
    if (tags.some((t) => pattern.test(t))) return { field, survey };
  }
  const tag = tags[0];
  return tag ? { field: tag.replace(/_/g, " "), survey: "Survey field" } : { field: "Survey field", survey: "LSST" };
}

function toVisit(raw: RawVisit): RubinVisit {
  return {
    time: fromMjd(raw.t_min),
    ...describeField(raw.target_name ?? ""),
    band: bandFor(raw.em_min),
    ra: raw.s_ra,
    dec: raw.s_dec,
  };
}

// The latest night with visits in the last three days, or null (weather,
// engineering time, or the service is behind).
export async function fetchRubinNight(): Promise<RubinNight | null> {
  const now = toMjd(Date.now());
  const params = new URLSearchParams({
    start: String(now - LOOKBACK_DAYS),
    time: String(LOOKBACK_DAYS * 24),
    RESPONSEFORMAT: "json",
    columns: COLUMNS.join(","),
  });
  const res = await fetch(`${API_BASE}/obsloctap/schedule?${params}`).catch(() => {
    // A network or permission failure, not an HTTP error.
    throw new Error("Rubin's data service didn't respond");
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Drop forecast entries; only count visits that have happened.
  const visits = ((await res.json()) as RawVisit[]).filter((v) => v.t_min <= now).sort((a, b) => b.t_min - a.t_min);
  if (visits.length === 0) return null;

  const night: RawVisit[] = [visits[0]];
  for (const v of visits.slice(1)) {
    if (night[night.length - 1].t_min - v.t_min > NIGHT_GAP_DAYS) break;
    night.push(v);
  }

  const bands = new Set(night.map((v) => bandFor(v.em_min)).filter((b): b is Band => b !== null));
  return {
    latest: toVisit(night[0]),
    firstVisit: fromMjd(night[night.length - 1].t_min),
    visits: night.length,
    bands: BANDS.map(([b]) => b).reverse().filter((b) => bands.has(b)),
  };
}
