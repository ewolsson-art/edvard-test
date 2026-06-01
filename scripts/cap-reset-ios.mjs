#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, rmSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32", ...options });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} failed`))));
  });
}

function removeServerUrl(filePath) {
  if (!existsSync(filePath)) return;
  const cfg = JSON.parse(readFileSync(filePath, "utf8"));
  delete cfg.server;
  writeFileSync(filePath, JSON.stringify(cfg, null, 2) + "\n");
}

function removeAppDerivedData() {
  const derivedDataPath = path.join(homedir(), "Library/Developer/Xcode/DerivedData");
  if (!existsSync(derivedDataPath)) return;
  for (const entry of readdirSync(derivedDataPath)) {
    if (entry.startsWith("App-")) {
      rmSync(path.join(derivedDataPath, entry), { recursive: true, force: true });
      console.log(`Rensade Xcode-cache: ${entry}`);
    }
  }
}

console.log("Återskapar iOS-projektet rent från aktuell Capacitor-konfig...");
removeServerUrl(path.resolve("capacitor.config.json"));

if (existsSync(path.resolve("ios"))) {
  rmSync(path.resolve("ios"), { recursive: true, force: true });
  console.log("Tog bort gammal ios/-mapp med eventuell cachead extern URL.");
}

await run("npm", ["run", "build"]);
await run("npx", ["cap", "add", "ios"]);
await run("npx", ["cap", "sync", "ios"]);
await run("node", ["scripts/install-ios-native-guard.mjs"]);

removeServerUrl(path.resolve("capacitor.config.json"));
removeServerUrl(path.resolve("ios/App/App/capacitor.config.json"));
removeAppDerivedData();

console.log("\n✅ Rent iOS-projekt skapat utan server.url.");
console.log("Nästa steg: öppna Xcode med npm run cap:open:ios, välj iPhone och tryck Play.");