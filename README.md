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

## Develop

- `npm run dev` runs the page at http://localhost:5173. Vite proxies the API, because it doesn't allow cross-origin requests from ordinary web pages.
- `npm run watch` rebuilds `dist/` on every save. After each rebuild, click the reload icon on the extension in `chrome://extensions`.

## How the data works

`GET https://spacetelescopelive.org/api/get/{webb|hubble}` with the header `endpoint: current` returns the current observation. Webb and Hubble use different field names; `src/api/telescopes.ts` maps both to one `Observation` shape. The last result is cached in `localStorage`, so a new tab renders immediately and still shows something offline.

This is an undocumented API used by the site's own frontend, so it may change without notice.
