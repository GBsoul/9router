import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { parseGrokBuildConfig, applyGrokBuildConfig, resetGrokBuildConfig } from "../../src/lib/grokBuildConfig.js";
import { mergeWithDefaults } from "../../src/lib/db/repos/settingsRepo.js";

const require = createRequire(import.meta.url);
const { migrateLegacyDataDir } = require("../../cli/hooks/legacyMigration.js");

describe("rebrand: ~/.9router → ~/.aio-router data dir migration", () => {
  const setup = () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "aio-rebrand-"));
    const legacy = path.join(home, ".9router");
    const target = path.join(home, ".aio-router");
    fs.mkdirSync(path.join(legacy, "db"), { recursive: true });
    fs.writeFileSync(path.join(legacy, "db", "data.sqlite"), "db");
    fs.writeFileSync(path.join(legacy, "jwt-secret"), "secret", { mode: 0o600 });
    return { legacy, target };
  };

  it("moves legacy entries and does not run twice", () => {
    const { legacy, target } = setup();
    expect(migrateLegacyDataDir(target, legacy)).toBe(true);
    expect(fs.readFileSync(path.join(target, "db", "data.sqlite"), "utf8")).toBe("db");
    expect(fs.readFileSync(path.join(target, "jwt-secret"), "utf8")).toBe("secret");
    if (process.platform !== "win32") {
      expect(fs.statSync(path.join(target, "jwt-secret")).mode & 0o777).toBe(0o600);
    }
    expect(migrateLegacyDataDir(target, legacy)).toBe(false);
  });

  it("keeps entries that already exist in the new dir (postinstall runtime/)", () => {
    const { legacy, target } = setup();
    fs.mkdirSync(path.join(legacy, "runtime"));
    fs.writeFileSync(path.join(legacy, "runtime", "marker"), "old");
    fs.mkdirSync(path.join(target, "runtime"), { recursive: true });
    fs.writeFileSync(path.join(target, "runtime", "marker"), "new");
    migrateLegacyDataDir(target, legacy);
    expect(fs.readFileSync(path.join(target, "runtime", "marker"), "utf8")).toBe("new");
    expect(fs.existsSync(path.join(target, "db", "data.sqlite"))).toBe(true);
  });

  it("is a no-op without a legacy dir", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "aio-rebrand-"));
    expect(migrateLegacyDataDir(path.join(home, ".aio-router"), path.join(home, ".9router"))).toBe(false);
    expect(fs.existsSync(path.join(home, ".aio-router"))).toBe(false);
  });
});

describe("rebrand: Grok Build legacy 9router slots", () => {
  const LEGACY = `# 9router-prev-default = "grok-4.5"
[models]
default = "9router"

[subagents.models]
explore = "9router-explore"

[model.9router]
model = "cc/claude"
base_url = "http://localhost:20128/v1"

[model.9router-explore]
model = "cc/haiku"
base_url = "http://localhost:20128/v1"
`;

  it("reads legacy slots as the current ones", () => {
    const parsed = parseGrokBuildConfig(LEGACY);
    expect(parsed.default).toBe("aio-router");
    expect(parsed.model?.model).toBe("cc/claude");
    expect(parsed.subagentMappings.explore).toBe("aio-router-explore");
  });

  it("apply rewrites legacy slots instead of adding a second copy", () => {
    const next = applyGrokBuildConfig(LEGACY, { baseUrl: "http://localhost:20128/v1", apiKey: "k", model: "cc/opus" });
    expect(next).not.toMatch(/9router/);
    expect(next.match(/^\[model\.aio-router\]$/gm)).toHaveLength(1);
  });

  it("reset removes legacy slots and restores the previous default", () => {
    const next = resetGrokBuildConfig(LEGACY);
    expect(next).not.toMatch(/9router|aio-router/);
    expect(parseGrokBuildConfig(next).default).toBe("grok-4.5");
  });
});

describe("rebrand: SAML SP entity ID", () => {
  it("keeps the old default issuer for SAML configured before the rename", () => {
    expect(mergeWithDefaults({ samlEntryPoint: "https://idp.example/sso" }).samlIssuer).toBe("urn:9router:sp");
  });

  it("uses the new default for fresh installs and keeps explicit values", () => {
    expect(mergeWithDefaults({}).samlIssuer).toBe("urn:aio-router:sp");
    expect(mergeWithDefaults({ samlEntryPoint: "x", samlIssuer: "urn:custom" }).samlIssuer).toBe("urn:custom");
  });
});
