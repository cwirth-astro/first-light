import { useState } from "react";
import type { Apod } from "../api/apod";

// Starfield gradient, with NASA's Astronomy Picture of the Day faded in on top
// once it loads.
export function Background({ apod }: { apod: Apod | null }) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  return (
    <div className="background" aria-hidden>
      {apod && (
        <img
          className={`background__image${loadedUrl === apod.imageUrl ? " is-loaded" : ""}`}
          src={apod.imageUrl}
          alt=""
          onLoad={() => setLoadedUrl(apod.imageUrl)}
        />
      )}
      <div className="background__scrim" />
    </div>
  );
}

export function ApodCaption({ apod }: { apod: Apod }) {
  return (
    <a className="apod-caption" href={apod.link} title={apod.alt}>
      <span className="apod-caption__label">Astronomy Picture of the Day</span>
      <span className="apod-caption__title">{apod.title}</span>
      {apod.credit && <span className="apod-caption__credit">{apod.credit}</span>}
    </a>
  );
}
