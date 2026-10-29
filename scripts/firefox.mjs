// Writes dist-firefox/: the Chrome build in dist/ plus the manifest keys
// Firefox requires. Kept out of public/manifest.json so the Chrome Web Store
// package has no unrecognized keys. Run through `npm run build:firefox`.
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist-firefox");

rmSync(out, { recursive: true, force: true });
cpSync(resolve(root, "dist"), out, { recursive: true });

const manifest = JSON.parse(readFileSync(resolve(out, "manifest.json"), "utf8"));
manifest.browser_specific_settings = {
  gecko: {
    // Permanent: addons.mozilla.org ties the listing and updates to this ID.
    id: "first-light@cwirth-astro.github.io",
    // 140 (the current ESR) is the first release that reads data_collection_permissions.
    strict_min_version: "140.0",
    // Required for new add-ons. Nothing leaves the device (see PRIVACY.md).
    data_collection_permissions: { required: ["none"] },
  },
};
writeFileSync(resolve(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${out}`);
