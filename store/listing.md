# Chrome Web Store submission

Copy these into the Chrome Web Store Developer Dashboard. The same text works for Microsoft Edge Add-ons.

Upload: `release/first-light-<version>.zip`, built with `npm run package`. Bump `version` in `public/manifest.json` for every update.

## Store listing tab

**Name** (from the manifest): First Light

**Summary** (from the manifest description, 132 characters max):
A new tab page showing what JWST, Hubble, and Rubin are observing, plus your day.

**Category:** Productivity (alternative: Education)

**Language:** English

**Description:**

```
Replace your new tab page with a live view of the sky.

Every new tab shows what the James Webb and Hubble space telescopes are observing right now: the target, the science program, the instruments, and how far along the observation is. A third card follows Rubin Observatory's Legacy Survey of Space and Time (LSST), showing the field it surveyed most recently, the filter, and how many visits it made that night.

Behind it all is NASA's Astronomy Picture of the Day, a shuffle of recent JWST and Hubble images, or a simple starfield.

Plan your day from the same page:
• A to-do list. Press Enter to add a task, click to check it off.
• Today's Google Calendar events, if you connect a calendar.

Make it yours: in Settings, pick the background, choose which telescopes to show, and turn each observation detail on or off.

Private by design: no account, no ads, no analytics. Your settings, to-dos and calendar stay on your computer.

This extension replaces the new tab page.

Data: JWST and Hubble observations from Space Telescope Live (spacetelescopelive.org); Rubin visits from Rubin Observatory's ObsLocTAP service; pictures from NASA APOD, ESA/Webb and ESA/Hubble, credited on the page. Not affiliated with NASA, ESA, STScI or Rubin Observatory.
```

**Graphics** (in `store/`):
- Store icon: 128×128, `public/icons/icon128.png`
- Screenshots: 1280×800, `store/screenshots/*.png`
- Small promo tile: 440×280, `store/promo-small.png`

## Privacy practices tab

**Single purpose:**
Replaces the new tab page with a dashboard that shows live telescope observations and an astronomy background, alongside the user's to-do list and calendar for the day.

**Permission justifications:**

- **`storage`:** Saves the user's settings and to-do list on their device so they persist between new tabs and survive clearing browsing data. Nothing is synced or sent anywhere.
- **Host permission `https://spacetelescopelive.org/*`:** Fetches what the JWST and Hubble space telescopes are currently observing. The site's API does not allow cross-origin requests, so the extension needs host access to read it.
- **Host permission `https://usdf-rsp.slac.stanford.edu/*`:** Fetches Rubin Observatory's recent survey visits from its public ObsLocTAP service, which does not allow cross-origin requests.
- **Optional host permission `https://calendar.google.com/*`:** Requested only when the user pastes in a Google Calendar "secret address in iCal format", to read that calendar's events and show today's schedule. Google's calendar feeds do not allow cross-origin requests. Not requested at install.
- **Remote code:** No. All JavaScript is bundled in the package. No remote scripts, eval or new Function.

**Data usage.** Chrome counts data as collected only if it is transmitted off the user's device to the developer or a third party. This extension keeps everything in local storage, and its network requests only download public data or the user's own calendar feed. Check no data types, then check all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

If a reviewer pushes back on the calendar, declare **Personal communications** (calendar events) and explain that they are read on the device to display the schedule and are never transmitted.

**Privacy policy URL:** https://github.com/cwirth-astro/first-light/blob/main/PRIVACY.md (also linked at the bottom of the extension's Settings panel)

## Distribution tab

**Visibility:** Unlisted to start (only people with the link can install), then Public.

**Regions:** All.

## Before going public

- Ask Space Telescope Live for permission to use their API. It is undocumented and serves their own site.
