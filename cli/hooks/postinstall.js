#!/usr/bin/env node

// Postinstall: warm-up SQLite deps into ~/.aio-router/runtime so the first
// `aio-router` start doesn't need network. Failure here is non-fatal —
// cli.js will retry at runtime if anything is missing.
const { ensureSqliteRuntime } = require("./sqliteRuntime");
const { ensureTrayRuntime } = require("./trayRuntime");
const { migrateLegacyDataDir } = require("./legacyMigration");

// Before warm-up creates ~/.aio-router/runtime, carry over a pre-rebrand ~/.9router.
if (migrateLegacyDataDir()) console.log("[aio-router] migrated data from ~/.9router");

try {
  ensureSqliteRuntime({ silent: false });
  console.log("[aio-router] runtime SQLite deps ready");
} catch (e) {
  console.warn(`[aio-router] runtime warm-up skipped: ${e.message}`);
}

try {
  ensureTrayRuntime({ silent: false });
} catch (e) {
  console.warn(`[aio-router] tray runtime skipped: ${e.message}`);
}

process.exit(0);
