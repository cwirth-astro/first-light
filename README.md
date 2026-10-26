# Observing Homepage

A Chrome new tab page that shows what the James Webb and Hubble space telescopes are observing right now. The data comes from [Space Telescope Live](https://spacetelescopelive.org).

## Install

```sh
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `dist/` folder.

Open a new tab. Chrome may ask whether to keep the new tab page from this extension; choose **Keep it**.

## Features

- **Telescope cards:** what Webb and Hubble are observing now, with progress through the observation.
- **Backgrounds:** NASA's Astronomy Picture of the Day, a shuffle of recent ESA/Webb and ESA/Hubble images (a new one each tab, or click the shuffle icon next to the caption), or a plain starfield.
- **To-do list:** press Enter to add a task, double-click a task to edit it, and hover over it to delete it.
- **Settings:** click the gear icon (bottom right) to choose the background, show or hide each telescope and each observation detail, or hide the to-do list.

Settings and to-dos are saved in the extension's `localStorage` on this computer. They stay in sync across open tabs but not across devices, and are deleted if the extension is removed.

## Browsers

It currently runs in Chrome and Edge, and Firefox and Safari support is planned. The page avoids Chrome-only APIs, and newer web features fall back gracefully: the settings panel's click-outside and close animations have fallbacks, and the invoker-commands polyfill loads only in browsers that need it. `CLAUDE.md` has the support policy and notes on packaging for other browsers.

## Develop

- `npm run dev` runs the page at http://localhost:5173. Vite proxies the API, because it doesn't allow cross-origin requests from ordinary web pages.
- `npm run watch` rebuilds `dist/` on every save. After each rebuild, click the reload icon on the extension in `chrome://extensions`.

## How the data works

`GET https://spacetelescopelive.org/api/get/{webb|hubble}` with the header `endpoint: current` returns the current observation. Webb and Hubble use different field names; `src/api/telescopes.ts` maps both to one `Observation` shape. The last result is cached in `localStorage`, so a new tab renders immediately and still shows something offline.

This is an undocumented API used by the site's own frontend, so it may change without notice.

The background is NASA's [Astronomy Picture of the Day](https://science.nasa.gov/apod/), read from the RSS feed at `https://science.nasa.gov/feed/apod-basic/` (`src/api/apod.ts`). The `api.nasa.gov` APOD API currently returns the NASA logo instead of the picture, because APOD moved to science.nasa.gov. The feed needs no API key. It is checked at most once an hour and cached in `localStorage`; if it can't be reached, the starfield gradient shows instead.

The shuffle draws from the ESA/Webb and ESA/Hubble image feeds (`src/api/spaceImages.ts`), leaving out annotated versions, spectra, artist's impressions and event photos. The image list is refreshed daily.
