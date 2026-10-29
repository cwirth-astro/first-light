# First Light

A new tab page for Chrome, Edge and Firefox that shows what the James Webb and Hubble space telescopes are observing right now, what Rubin Observatory surveyed most recently, and the rest of your day from Google Calendar. The JWST and Hubble data comes from [Space Telescope Live](https://spacetelescopelive.org).

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

In Firefox, run `npm run firefox`. It builds `dist-firefox/` and opens a separate Firefox window with the extension installed, which reloads when files in `dist-firefox/` change. To load it into your own Firefox instead, run `npm run build:firefox`, open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and pick `dist-firefox/manifest.json`. Temporary add-ons are removed when Firefox quits.

## FAQ

**My bookmarks bar disappeared.** Chrome and Edge show the bookmarks bar on their own new tab page even when it's hidden everywhere else, but not on a new tab page from an extension. To keep it on every page, including First Light, turn on **Always show bookmarks bar**: press ⌘+Shift+B on a Mac or Ctrl+Shift+B on Windows, or open the ⋮ menu → **Bookmarks and lists** → **Show bookmarks bar**. In Edge it's Settings → Appearance → **Show favorites bar** → **Always**; in Firefox, View → Toolbars → Bookmarks Toolbar → **Always Show**. An extension can't change this setting.

**My to-dos or settings disappeared.** Versions before 0.1.1 kept them in the page's `localStorage`, which clearing browsing data erases. 0.1.1 and later keep them in extension storage, which survives that. Removing the extension, or loading an unpacked copy from a different folder, still starts it fresh.

## Features

- **Telescope cards:** what JWST and Hubble are observing now, with progress through the observation.
- **Rubin card:** Rubin has no single target; it takes a visit every ~40 seconds while sweeping the southern sky. The card shows the survey field of the latest visit, its filter, the night's visit count and filters, and a link to the live all-sky camera.
- **Calendar:** the rest of today's Google Calendar events, next to the to-do list. In Settings → Widgets, paste each calendar's "Secret address in iCal format" (Google Calendar → Settings → the calendar → Integrate calendar). Read-only, refreshed every 15 minutes.
- **Backgrounds:** NASA's Astronomy Picture of the Day, a shuffle of recent ESA/Webb and ESA/Hubble images (a new one each tab, or click the shuffle icon next to the caption), or a plain starfield.
- **To-do list:** press Enter to add a task, double-click a task to edit it, and hover over it to delete it.
- **Settings:** click the gear icon (bottom right) to choose the background, show or hide each telescope and each observation detail, or hide the to-do list and calendar.

Settings (including calendar addresses) and to-dos are saved in the extension's local storage (`browser.storage.local`), with a copy in `localStorage` so a new tab draws them on its first frame. Extension storage survives clearing browsing data, which wipes an extension page's `localStorage`. Cached telescope and picture data stays in `localStorage`, since it can be fetched again. Everything stays in sync across open tabs but not across devices, and is deleted if the extension is removed.

## Browsers

It runs in Chrome, Edge and Firefox 140 or later; Safari support is planned. The page avoids Chrome-only APIs, and newer web features fall back gracefully: the settings panel's click-outside and close animations have fallbacks, and the settings button opens the panel with a click handler in browsers without invoker commands.

Firefox gets its own build, `dist-firefox/`, written by `scripts/firefox.mjs`: the same files with Firefox's manifest keys added (the add-on ID, a minimum version, and the data-collection declaration addons.mozilla.org requires). Firefox lets users turn off an extension's site access in `about:addons`, so the telescope and Rubin cards check their permission and show an **Allow access** button when it's missing.

Safari needs the extension wrapped in an app with `xcrun safari-web-extension-converter`.

## Develop

- `npm run dev` runs the page at http://localhost:5173. Vite proxies the telescope, Rubin and Google Calendar requests, because those servers don't allow cross-origin requests from ordinary web pages. The built extension calls them directly using `host_permissions`.
- `npm run watch` rebuilds `dist/` on every save. After each rebuild, click the reload icon on the extension in `chrome://extensions`.
- `npm run firefox` builds for Firefox and opens it in a separate Firefox window (see Install). `npm run lint:firefox` runs Mozilla's add-on linter on `dist-firefox/`, the same checks addons.mozilla.org runs on upload. Its two `innerHTML` warnings come from React's own code and are expected.

## Publish

`npm run package` builds both versions and writes to `release/`:

- `first-light-<version>.zip` for the Chrome Web Store and Microsoft Edge Add-ons
- `first-light-<version>-firefox.zip` for addons.mozilla.org
- `first-light-<version>-source.zip`, the last commit's source. addons.mozilla.org asks for the source of bundled code; reviewers rebuild it with `npm install && npm run build:firefox` (Node 20 or later).

Bump `version` in `public/manifest.json` and `package.json`, and commit, first. `store/listing.md` has the listing text, the permission justifications and the privacy answers; `store/screenshots/` and `store/promo-small.png` are the listing images; `PRIVACY.md` is the privacy policy.

Google Calendar access is an optional permission: the extension asks for it when you paste in a calendar address, so installing it only asks for the telescope data sites.

## How the data works

`GET https://spacetelescopelive.org/api/get/{webb|hubble}` with the header `endpoint: current` returns the current observation. JWST and Hubble use different field names; `src/api/telescopes.ts` maps both to one `Observation` shape. The last result is cached in `localStorage`, so a new tab renders immediately and still shows something offline.

This is an undocumented API used by the site's own frontend, so it may change without notice.

The background is NASA's [Astronomy Picture of the Day](https://science.nasa.gov/apod/), read from the RSS feed at `https://science.nasa.gov/feed/apod-basic/` (`src/api/apod.ts`). The `api.nasa.gov` APOD API currently returns the NASA logo instead of the picture, because APOD moved to science.nasa.gov. The feed needs no API key. It is checked at most once an hour and cached in `localStorage`; if it can't be reached, the starfield gradient shows instead.

Rubin visits come from [ObsLocTAP](https://usdf-rsp.slac.stanford.edu/obsloctap/static/viewer.html) (`src/api/rubin.ts`), Rubin's public service listing scheduled and completed visits. The card asks for the last two days, groups the latest night's visits, and turns the scheduler's region tags (`lowdust`, `ddf_edfs_a`, …) into readable names. It refreshes every 5 minutes while Rubin is observing and every 30 otherwise. Other public Rubin data, not used yet: the [all-sky camera](https://storage.googleapis.com/epo_rubintv_data/all_sky_current/all_sky_current.jpg), the alert stream through community brokers such as [Fink](https://api.lsst.fink-portal.org) (nightly alert statistics, updated with a lag), and nightly scheduler reports.

Calendar feeds are parsed with [ical.js](https://github.com/kewisch/ical.js) (`src/api/calendar.ts`), which expands recurring events and their edited occurrences. It is loaded only once a calendar is connected.

The shuffle draws from the ESA/Webb and ESA/Hubble image feeds (`src/api/spaceImages.ts`), leaving out annotated versions, spectra, artist's impressions and event photos. The image list is refreshed daily.

## License

[MIT](LICENSE). Images and observation data belong to their sources (NASA, ESA, STScI, Rubin Observatory and the photographers credited on the page) and are not covered by this license.
