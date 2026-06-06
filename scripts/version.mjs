/**
 * Bumpa la versione di client o server e crea un tag git dedicato.
 *
 * Uso:  node scripts/version.mjs <client|server> <major|minor|patch>
 * Tag:  client-1.2.0  /  server-3.1.2
 */

import { execSync }   from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }   from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot  = resolve(__dirname, "..");

// ── Argomenti ──────────────────────────────────────────────────────────────────

const [,, pkg, bump] = process.argv;

const VALID_PKG  = ["client", "server"];
const VALID_BUMP = ["major", "minor", "patch"];

if (!VALID_PKG.includes(pkg) || !VALID_BUMP.includes(bump)) {
  console.error(
    "\nUso: node scripts/version.mjs <client|server> <major|minor|patch>\n"
  );
  process.exit(1);
}

const pkgDir      = resolve(repoRoot, pkg);
const pkgJsonPath = resolve(pkgDir, "package.json");

const run = (cmd, cwd = repoRoot) =>
  execSync(cmd, { cwd, stdio: "inherit" });

// ── 1. Bump versione (solo package.json, nessun tag npm) ──────────────────────

run(`npm version ${bump} --no-git-tag-version`, pkgDir);

// ── 2. Leggi la nuova versione ────────────────────────────────────────────────

const { version } = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
const tag = `${pkg}-${version}`;

// ── 3. Commit + tag git ───────────────────────────────────────────────────────

run(`git add ${pkg}/package.json`);
run(`git commit -m "chore(${pkg}): bump version to ${version}"`);
run(`git tag ${tag}`);

console.log(`\n✓  ${tag}\n`);
