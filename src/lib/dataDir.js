import fs from "node:fs";
import path from "path";
import os from "os";

const APP_NAME = "aio-router";
// Pre-rebrand name: data written by 9Router lives under ~/.9router (%APPDATA%\9router).
const LEGACY_APP_NAME = "9router";
const MIGRATION_MARKER = ".migrated-from-9router";

function homeDirFor(name) {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), name);
  }
  return path.join(os.homedir(), `.${name}`);
}

function defaultDir() {
  return homeDirFor(APP_NAME);
}

// One-time move of the pre-rebrand home dir into the new one. Entry-by-entry so it
// still works when the new dir already exists (the CLI postinstall creates runtime/
// first); entries already present in the new dir win. Copy is the fallback for
// Windows, where a still-running old server can hold files open.
export function migrateLegacyDataDir(target = defaultDir(), legacy = homeDirFor(LEGACY_APP_NAME)) {
  try {
    if (!fs.existsSync(legacy) || fs.existsSync(path.join(target, MIGRATION_MARKER))) return;
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(legacy)) {
      const to = path.join(target, entry);
      if (fs.existsSync(to)) continue;
      const from = path.join(legacy, entry);
      try {
        fs.renameSync(from, to);
      } catch {
        fs.cpSync(from, to, { recursive: true });
      }
    }
    fs.writeFileSync(path.join(target, MIGRATION_MARKER), `${legacy}\n`);
    console.log(`[DATA_DIR] migrated ${legacy} → ${target}`);
  } catch (e) {
    console.warn(`[DATA_DIR] could not migrate ${legacy} → ${target}: ${e.message}`);
  }
}

export function getDataDir() {
  // Usage/log files stay in the home dir even when DATA_DIR is set, so migrate regardless.
  migrateLegacyDataDir();
  const configured = process.env.DATA_DIR;
  if (!configured) return defaultDir();

  // On Windows, ignore Unix-style absolute paths (e.g. /var/lib/...) that come
  // from a Linux-targeted .env or Docker config — they are not valid here.
  if (process.platform === "win32" && /^\//.test(configured)) {
    console.warn(`[DATA_DIR] '${configured}' is a Unix path on Windows → fallback to default`);
    return defaultDir();
  }

  try {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  } catch (e) {
    if (e?.code === "EACCES" || e?.code === "EPERM") {
      console.warn(`[DATA_DIR] '${configured}' not writable → fallback ~/.${APP_NAME}`);
      return defaultDir();
    }
    throw e;
  }
}

export const DATA_DIR = getDataDir();
