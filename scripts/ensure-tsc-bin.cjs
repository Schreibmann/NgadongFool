/*
 * npm bin-link guard.
 *
 * ts-jest 29 needs the TypeScript 6 JavaScript API, which the native
 * TypeScript 7 (`@typescript/native`, aliased from `typescript@7`) does not
 * expose. So `typescript` is aliased to `@typescript/typescript6` — a mirror
 * that re-exports TypeScript 6. That mirror depends on `@typescript/old`
 * (TypeScript 6), whose `tsc` bin can overwrite node_modules/.bin/tsc
 * depending on install order, silently making `tsc` run TypeScript 6.
 *
 * This script re-points the tsc shims at the `@typescript/native` package
 * (TypeScript 7). It runs from the `postinstall` npm hook and is a no-op when
 * the link is already correct or when TypeScript 7 is absent (production
 * installs).
 */
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const binDir = path.join(rootDir, "node_modules", ".bin");
const ts7PackageJson = path.join(
  rootDir,
  "node_modules",
  "@typescript",
  "native",
  "package.json"
);

if (!fs.existsSync(ts7PackageJson)) {
  // TypeScript 7 is a dev dependency; production installs have nothing to fix.
  process.exit(0);
}

let repointed = 0;
for (const name of ["tsc", "tsc.cmd", "tsc.ps1"]) {
  const file = path.join(binDir, name);
  if (!fs.existsSync(file)) {
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  // The clobbering shim references the competing package's path verbatim;
  // both POSIX (forward slashes) and Windows (backslashes) shims are handled.
  let fixed = text.split("@typescript\\old").join("@typescript\\native");
  fixed = fixed.split("@typescript/old").join("@typescript/native");
  if (fixed !== text) {
    fs.writeFileSync(file, fixed);
    repointed += 1;
  }
}

if (repointed > 0) {
  const version = JSON.parse(fs.readFileSync(ts7PackageJson, "utf8")).version;
  console.log(
    `ensure-tsc-bin: repointed ${repointed} shim(s) -> typescript@${version}`
  );
}
