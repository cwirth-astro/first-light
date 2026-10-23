export interface Apod {
  title: string;
  date: string;
  imageUrl: string;
  alt: string;
  credit: string | null;
  link: string;
}

// APOD moved to science.nasa.gov in 2026, and api.nasa.gov now returns a NASA
// logo instead of the picture. This RSS feed has the real data, no API key,
// and allows cross-origin requests.
const FEED_URL = "https://science.nasa.gov/feed/apod-basic/";
const APOD_NS = "https://science.nasa.gov/apod/";
const IMAGE_WIDTH = 2560;

export async function fetchApod(): Promise<Apod> {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`APOD feed failed (${res.status})`);
  const xml = new DOMParser().parseFromString(await res.text(), "application/xml");

  const item = xml.querySelector("item");
  const field = (name: string) => item?.getElementsByTagNameNS(APOD_NS, name)[0]?.textContent?.trim() || null;
  const hdurl = field("hdurl");
  if (!item || !hdurl) throw new Error("No APOD in feed");

  return {
    title: item.querySelector("title")?.textContent?.trim() ?? "Astronomy Picture of the Day",
    date: item.querySelector("pubDate")?.textContent ?? "",
    imageUrl: resize(hdurl),
    alt: field("alt") ?? "",
    credit: htmlToText(field("credit")),
    link: item.querySelector("link")?.textContent?.trim() ?? "https://science.nasa.gov/apod/",
  };
}

// The asset host resizes on the fly; full-size originals can be several MB.
function resize(url: string): string {
  const u = new URL(url);
  u.searchParams.set("w", String(IMAGE_WIDTH));
  u.searchParams.delete("h");
  u.searchParams.set("fit", "clip");
  return u.toString();
}

// Credits arrive as HTML snippets ("<em>Image Credit:</em> <a>NASA</a>, ...").
function htmlToText(html: string | null): string | null {
  if (!html) return null;
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").replace(/\s+([,;])/g, "$1").trim() || null;
}
