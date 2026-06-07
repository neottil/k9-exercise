/**
 * Legge la versione dal package.json di client o server e crea un tag git.
 *
 * Uso:  node scripts/version.mjs <client|server>
 * Tag:  client-1.2.0  /  server-3.1.2
 *
 * Modifica manualmente <pkg>/package.json alla versione desiderata,
 * poi lancia questo script.
 */

import { execSync }    from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }   from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot  = resolve(__dirname, "..");

// ── Argomento ─────────────────────────────────────────────────────────────────

const [,, pkg] = process.argv;

if (!["client", "server"].includes(pkg)) {
  console.error("\nUso: node scripts/version.mjs <client|server>\n");
  process.exit(1);
}

// ── Leggi versione dal package.json ──────────────────────────────────────────

const pkgJsonPath = resolve(repoRoot, pkg, "package.json");
const { version } = JSON.parse(readFileSync(pkgJsonPath, "utf8"));

if (!version) {
  console.error(`\nNessuna versione trovata in ${pkg}/package.json\n`);
  process.exit(1);
}

const tag = `${pkg}-${version}`;

// ── Tag git ───────────────────────────────────────────────────────────────────

execSync(`git tag ${tag}`, { cwd: repoRoot, stdio: "inherit" });

console.log(`\n✓  ${tag}\n`);
