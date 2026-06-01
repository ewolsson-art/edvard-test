#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32", ...options });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} failed`))));
  });
}

const configPath = path.resolve("capacitor.config.json");
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Safe default: no server.url. The app is loaded from the native bundle inside
// Xcode's WebView, so iOS can never bounce to a Lovable/browser URL.
delete cfg.server;
fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");

console.log("✅ iPhone dev-läge: lokal bundled app, ingen extern server.url");
console.log("Bygger webben och synkar till Xcode...");
await run("npm", ["run", "build"]);
await run("npx", ["cap", "sync", "ios"]);

console.log("Öppnar Xcode. Tryck Play på din iPhone därifrån.");
await run("npx", ["cap", "open", "ios"]);

console.log("\n✅ Klart. Efter framtida ändringar: kör npm run cap:dev:ios igen och tryck Play i Xcode.");