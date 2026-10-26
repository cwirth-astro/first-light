// Zips dist/ into release/first-light-<version>.zip for the Chrome Web
// Store (and Edge Add-ons). Run through `npm run package`, which builds first.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(resolve(root, "dist/manifest.json"), "utf8"));
const out = resolve(root, `release/first-light-${version}.zip`);

mkdirSync(resolve(root, "release"), { recursive: true });
rmSync(out, { force: true });
// manifest.json must sit at the root of the zip, so zip from inside dist/.
execFileSync("zip", ["-r", "-X", "-q", out, ".", "-x", ".*"], { cwd: resolve(root, "dist"), stdio: "inherit" });
console.log(`Wrote ${out}`);
