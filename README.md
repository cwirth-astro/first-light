# Observing Homepage

A Chrome new tab page that shows what the James Webb and Hubble space telescopes are observing right now, what Rubin Observatory surveyed most recently, and the rest of your day from Google Calendar. The JWST and Hubble data comes from [Space Telescope Live](https://spacetelescopelive.org).

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

- **Telescope cards:** what JWST and Hubble are observing now, with progress through the observation.
- **Rubin card:** Rubin has no single target; it takes a visit every ~40 seconds while sweeping the southern sky. The card shows the survey field of the latest visit, its filter, the night's visit count and filters, and a link to the live all-sky camera.
- **Calendar:** the rest of today's Google Calendar events, next to the to-do list. In Settings → Widgets, paste each calendar's "Secret address in iCal format" (Google Calendar → Settings → the calendar → Integrate calendar). Read-only, refreshed every 15 minutes.
- **Backgrounds:** NASA's Astronomy Picture of the Day, a shuffle of recent ESA/Webb and ESA/Hubble images (a new one each tab, or click the shuffle icon next to the caption), or a plain starfield.
- **To-do list:** press Enter to add a task, double-click a task to edit it, and hover over it to delete it.
- **Settings:** click the gear icon (bottom right) to choose the background, show or hide each telescope and each observation detail, or hide the to-do list and calendar.

Settings (including calendar addresses), to-dos and cached data are saved in the extension's `localStorage` on this computer. They stay in sync across open tabs but not across devices, and are deleted if the extension is removed.

## Browsers

It currently runs in Chrome and Edge, and Firefox and Safari support is planned. The page avoids Chrome-only APIs, and newer web features fall back gracefully: the settings panel's click-outside and close animations have fallbacks, and the settings button opens the panel with a click handler in browsers without invoker commands. Packaging for Firefox will need a `browser_specific_settings.gecko.id` in the manifest, and Safari needs the extension wrapped in an app with `xcrun safari-web-extension-converter`.

## Develop

- `npm run dev` runs the page at http://localhost:5173. Vite proxies the telescope, Rubin and Google Calendar requests, because those servers don't allow cross-origin requests from ordinary web pages. The built extension calls them directly using `host_permissions`.
- `npm run watch` rebuilds `dist/` on every save. After each rebuild, click the reload icon on the extension in `chrome://extensions`.

## Publish

`npm run package` builds the extension and writes `release/observing-homepage-<version>.zip`, ready to upload to the Chrome Web Store or Microsoft Edge Add-ons. Bump `version` in `public/manifest.json` first. `store/listing.md` has the listing text, the permission justifications and the privacy answers; `store/screenshots/` and `store/promo-small.png` are the listing images; `PRIVACY.md` is the privacy policy.

Google Calendar access is an optional permission: the extension asks for it when you paste in a calendar address, so installing it only asks for the telescope data sites.

## How the data works

`GET https://spacetelescopelive.org/api/get/{webb|hubble}` with the header `endpoint: current` returns the current observation. JWST and Hubble use different field names; `src/api/telescopes.ts` maps both to one `Observation` shape. The last result is cached in `localStorage`, so a new tab renders immediately and still shows something offline.

This is an undocumented API used by the site's own frontend, so it may change without notice.

The background is NASA's [Astronomy Picture of the Day](https://science.nasa.gov/apod/), read from the RSS feed at `https://science.nasa.gov/feed/apod-basic/` (`src/api/apod.ts`). The `api.nasa.gov` APOD API currently returns the NASA logo instead of the picture, because APOD moved to science.nasa.gov. The feed needs no API key. It is checked at most once an hour and cached in `localStorage`; if it can't be reached, the starfield gradient shows instead.

Rubin visits come from [ObsLocTAP](https://usdf-rsp.slac.stanford.edu/obsloctap/static/viewer.html) (`src/api/rubin.ts`), Rubin's public service listing scheduled and completed visits. The card asks for the last two days, groups the latest night's visits, and turns the scheduler's region tags (`lowdust`, `ddf_edfs_a`, …) into readable names. It refreshes every 5 minutes while Rubin is observing and every 30 otherwise. Other public Rubin data, not used yet: the [all-sky camera](https://storage.googleapis.com/epo_rubintv_data/all_sky_current/all_sky_current.jpg), the alert stream through community brokers such as [Fink](https://api.lsst.fink-portal.org) (nightly alert statistics, updated with a lag), and nightly scheduler reports.

Calendar feeds are parsed with [ical.js](https://github.com/kewisch/ical.js) (`src/api/calendar.ts`), which expands recurring events and their edited occurrences. It is loaded only once a calendar is connected.

The shuffle draws from the ESA/Webb and ESA/Hubble image feeds (`src/api/spaceImages.ts`), leaving out annotated versions, spectra, artist's impressions and event photos. The image list is refreshed daily.
