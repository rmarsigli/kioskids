/**
 * Restores the better-sqlite3 native binary compiled for the current Node.js ABI.
 *
 * Why this is needed:
 *   `postinstall` runs `electron-rebuild`, which compiles better-sqlite3 for the
 *   Electron ABI (143). Vitest runs in the system Node (ABI 127). Before running
 *   tests, this script downloads/restores the prebuilt binary matching the
 *   system Node ABI from the npm prebuilds cache.
 *
 * Resolution strategy:
 *   1. Resolve better-sqlite3's package dir from the workspace root.
 *   2. Resolve prebuild-install/bin from better-sqlite3's transitive context.
 *   3. Run prebuild-install in better-sqlite3's cwd so it patches the .node file.
 */

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requireFromRoot = createRequire(path.join(root, 'package.json'));
const bsq3PkgJson = requireFromRoot.resolve('better-sqlite3/package.json');
const bsq3Dir = path.dirname(bsq3PkgJson);

// prebuild-install is a dep of better-sqlite3, not of the workspace root
const requireFromBsq3 = createRequire(bsq3PkgJson);
const prebuildBin = requireFromBsq3.resolve('prebuild-install/bin');

execFileSync(process.execPath, [prebuildBin], {
  cwd: bsq3Dir,
  stdio: 'inherit',
});
