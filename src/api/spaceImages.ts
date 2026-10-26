// What the background and its caption need, whatever the picture source.
export interface BackgroundImage {
  id: string;
  url: string;
  // Tried if `url` fails to load.
  fallbackUrl?: string;
  label: string;
  title: string;
  credit?: string | null;
  alt?: string;
  link: string;
}

// ESA's Webb and Hubble image archives: their latest releases, all of which
// have 2560px "wallpaper5" renditions. Both feeds allow cross-origin requests.
const FEEDS = [
  { url: "https://esawebb.org/images/feed/", label: "ESA/Webb" },
  { url: "https://esahubble.org/images/feed/", label: "ESA/Hubble" },
];

// Releases come with annotated/compass variants, spectra, artist's impressions
// and event photos; keep only clean telescope pictures.
const NOT_A_BACKGROUND =
  /annotated|compass|single filter|spectrum|workshop|conference|group photo|collage|composition of|location of|context image|over time|artist|illustration|infographic|diagram|chart/i;

export async function fetchShufflePool(): Promise<BackgroundImage[]> {
  const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed.url, feed.label)));
  const images = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (!images.length) throw new Error("No space images available");
  return images;
}

async function fetchFeed(url: string, label: string): Promise<BackgroundImage[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label} feed failed (${res.status})`);
  const xml = new DOMParser().parseFromString(await res.text(), "application/xml");

  return Array.from(xml.querySelectorAll("item")).flatMap((item) => {
    const title = item.querySelector("title")?.textContent?.trim() ?? label;
    const link = item.querySelector("link")?.textContent?.trim() ?? "";
    // e.g. https://esawebb.org/images/potm2610a/
    const match = link.match(/^https:\/\/(esawebb|esahubble)\.org\/images\/([^/]+)\//);
    if (!match || NOT_A_BACKGROUND.test(title)) return [];
    const [, site, imageId] = match;
    const cdn = `https://cdn.${site}.org/archives/images`;
    return [
      {
        id: `${site}:${imageId}`,
        url: `${cdn}/wallpaper5/${imageId}.jpg`,
        fallbackUrl: `${cdn}/screen/${imageId}.jpg`,
        label,
        title,
        link,
      },
    ];
  });
}
