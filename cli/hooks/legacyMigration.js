// One-time migration from the pre-rebrand "9router" install to "aio-router".
// Mirrors migrateLegacyDataDir() in src/lib/dataDir.js — keep the two in sync.
const fs = require("fs");
const os = require("os");
const path = require("path");

const APP_NAME = "aio-router";
const LEGACY_APP_NAME = "9router";
const MIGRATION_MARKER = ".migrated-from-9router";

function homeDirFor(name) {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), name);
  }
  return path.join(os.homedir(), `.${name}`);
}

// Move ~/.9router entries into ~/.aio-router. Entries already in the new dir win
// (postinstall may have created runtime/ before this runs). Copy is the fallback
// for Windows, where a still-running old server can hold files open.
function migrateLegacyDataDir(target = homeDirFor(APP_NAME), legacy = homeDirFor(LEGACY_APP_NAME)) {
  try {
    if (!fs.existsSync(legacy) || fs.existsSync(path.join(target, MIGRATION_MARKER))) return false;
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
    return true;
  } catch (e) {
    process.stderr.write(`[aio-router] could not migrate ${legacy} → ${target}: ${e.message}\n`);
    return false;
  }
}

// Old autostart entries launch the old package's cli.js, which is gone once
// 9router is uninstalled. Remove them; returns true if one was found so the
// caller can re-enable autostart under the new name. The macOS agent is not
// unloaded — that would SIGTERM us if launchd started this process — deleting
// the plist is enough to stop it from loading at next login.
function removeLegacyAutoStart() {
  const candidates = [];
  if (process.platform === "darwin") {
    candidates.push(path.join(os.homedir(), "Library", "LaunchAgents", `com.${LEGACY_APP_NAME}.autostart.plist`));
  } else if (process.platform === "win32") {
    candidates.push(path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs", "Startup", `${LEGACY_APP_NAME}.vbs`));
  } else if (process.platform === "linux") {
    candidates.push(path.join(os.homedir(), ".config", "autostart", `${LEGACY_APP_NAME}.desktop`));
  }
  let found = false;
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      fs.unlinkSync(file);
      found = true;
    } catch {}
  }
  return found;
}

module.exports = { migrateLegacyDataDir, removeLegacyAutoStart };
