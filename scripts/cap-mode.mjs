#!/usr/bin/env node
/**
 * Toggle capacitor.config.json mellan två lägen:
 *   - local : ingen server.url -> appen kör bundled dist/ INNE i appen (Xcode-läge)
 *   - remote: server.url pekar på lovable preview -> hot reload från sandbox
 *
 * Användning:
 *   node scripts/cap-mode.mjs local
 *   node scripts/cap-mode.mjs remote
 */
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (!["local", "remote"].includes(mode)) {
  console.error("Usage: node scripts/cap-mode.mjs <local|remote>");
  process.exit(1);
}

const REMOTE_URL =
  "https://98da7b9e-4e91-4e4a-9b6d-1a1ba6269510.lovableproject.com?forceHideBadge=true&native=1&native_dev=1";

const configPath = path.resolve("capacitor.config.json");
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (mode === "local") {
  delete cfg.server;
  console.log("✅ capacitor.config.json -> LOCAL (bundled dist/, kör helt i appen)");
} else {
  cfg.server = { url: REMOTE_URL, cleartext: true };
  console.log("✅ capacitor.config.json -> REMOTE (hot reload från lovable)");
}

fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");

// Spegla samma URL till iOS native capacitor.config.json om den finns
const iosCfg = path.resolve("ios/App/App/capacitor.config.json");
if (fs.existsSync(iosCfg)) {
  fs.writeFileSync(iosCfg, JSON.stringify(cfg, null, 2) + "\n");
  console.log("✅ iOS native capacitor.config.json synkad");
}
