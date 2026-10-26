import { useState } from "react";
import type { BackgroundImage } from "../api/spaceImages";

// Starfield gradient, with the chosen picture faded in on top once it loads.
export function Background({ image }: { image: BackgroundImage | null }) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const src = image && (failedUrl === image.url && image.fallbackUrl ? image.fallbackUrl : image.url);

  return (
    <div className="background" aria-hidden>
      {src && (
        <img
          key={src}
          className={`background__image${loadedUrl === src ? " is-loaded" : ""}`}
          src={src}
          alt=""
          onLoad={() => setLoadedUrl(src)}
          onError={() => setFailedUrl(src)}
        />
      )}
      <div className="background__scrim" />
    </div>
  );
}

export function BackgroundCaption({ image, onNext }: { image: BackgroundImage; onNext?: () => void }) {
  return (
    <div className="bg-caption">
      <a className="bg-caption__link" href={image.link} title={image.alt}>
        <span className="bg-caption__label">{image.label}</span>
        <span className="bg-caption__title">{image.title}</span>
        {image.credit && <span className="bg-caption__credit">{image.credit}</span>}
      </a>
      {onNext && (
        <button className="icon-button" onClick={onNext} aria-label="Show another picture" title="Show another picture">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
