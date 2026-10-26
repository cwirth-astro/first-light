import { useMemo } from "react";
import type { BackgroundImage } from "../api/spaceImages";
import type { BackgroundMode } from "../settings";
import { useApod } from "./useApod";
import { useShuffleImage } from "./useShuffleImage";

// The picture for the chosen background mode; null means the plain starfield.
// `next` is set when the mode supports picking another picture.
export function useBackgroundImage(mode: BackgroundMode): {
  image: BackgroundImage | null;
  next?: () => void;
} {
  const apod = useApod(mode === "apod");
  const shuffle = useShuffleImage(mode === "shuffle");

  const apodImage = useMemo<BackgroundImage | null>(
    () =>
      apod && {
        id: `apod:${apod.date}`,
        url: apod.imageUrl,
        label: "Astronomy Picture of the Day",
        title: apod.title,
        credit: apod.credit,
        alt: apod.alt,
        link: apod.link,
      },
    [apod],
  );

  if (mode === "apod") return { image: apodImage };
  if (mode === "shuffle") return { image: shuffle.image, next: shuffle.next };
  return { image: null };
}
