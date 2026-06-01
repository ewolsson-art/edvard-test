#!/usr/bin/env node
/**
 * Toggle capacitor.config.json mellan två lägen:
 *   - local : ingen server.url -> appen kör bundled dist/ INNE i appen (Xcode-läge)
 *   - remote: lokal Vite dev-server -> iPhone visar dina lokala ändringar
 *
 * Användning:
 *   node scripts/cap-mode.mjs local
 *   node scripts/cap-mode.mjs remote
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mode = process.argv[2];
if (!["local", "remote"].includes(mode)) {
  console.error("Usage: node scripts/cap-mode.mjs <local|remote>");
  process.exit(1);
}

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "localhost";
}

const REMOTE_URL = `http://${process.env.CAP_DEV_HOST || getLanIp()}:8080?native=1&native_dev=1`;

const configPath = path.resolve("capacitor.config.json");
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (mode === "local") {
  delete cfg.server;
  console.log("✅ capacitor.config.json -> LOCAL (bundled dist/, kör helt i appen)");
} else {
  console.warn("⚠️ REMOTE kan öppna webbinnehåll via server.url. Använd helst: npm run cap:dev:ios");
  cfg.server = { url: REMOTE_URL, cleartext: true };
  console.log(`✅ capacitor.config.json -> REMOTE (${REMOTE_URL})`);
}

fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");

// Spegla samma URL till iOS native capacitor.config.json om den finns
const iosCfg = path.resolve("ios/App/App/capacitor.config.json");
if (fs.existsSync(iosCfg)) {
  fs.writeFileSync(iosCfg, JSON.stringify(cfg, null, 2) + "\n");
  console.log("✅ iOS native capacitor.config.json synkad");
}
