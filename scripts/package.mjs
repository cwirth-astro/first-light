// Zips the builds for the stores. Run through `npm run package`, which builds
// both first. Writes to release/:
//   first-light-<version>.zip          Chrome Web Store and Edge Add-ons (dist/)
//   first-light-<version>-firefox.zip  addons.mozilla.org (dist-firefox/)
//   first-light-<version>-source.zip   source for AMO review, which requires it
//                                      for bundled code (the committed tree)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(resolve(root, "dist/manifest.json"), "utf8"));
const release = resolve(root, "release");
mkdirSync(release, { recursive: true });

function zip(dir, name) {
  const out = resolve(release, name);
  rmSync(out, { force: true });
  // manifest.json must sit at the root of the zip, so zip from inside the build.
  execFileSync("zip", ["-r", "-X", "-q", out, ".", "-x", ".*"], { cwd: resolve(root, dir), stdio: "inherit" });
  console.log(`Wrote ${out}`);
}

zip("dist", `first-light-${version}.zip`);
zip("dist-firefox", `first-light-${version}-firefox.zip`);

const source = resolve(release, `first-light-${version}-source.zip`);
execFileSync("git", ["archive", "--format=zip", "-o", source, "HEAD"], { cwd: root, stdio: "inherit" });
console.log(`Wrote ${source} (from the last commit)`);
