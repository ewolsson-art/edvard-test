#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32", ...options });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} failed`))));
  });
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function removeServerUrl(filePath) {
  const cfg = readJson(filePath);
  delete cfg.server;
  writeJson(filePath, cfg);
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

function verifyNativeBundle() {
  const iosConfigPath = path.resolve("ios/App/App/capacitor.config.json");
  const iosPublicIndexPath = path.resolve("ios/App/App/public/index.html");
  const storyboardPath = path.resolve("ios/App/App/Base.lproj/Main.storyboard");

  if (!existsSync(iosConfigPath)) {
    throw new Error("Saknar ios/App/App/capacitor.config.json efter sync.");
  }
  const iosConfigText = readFileSync(iosConfigPath, "utf8");
  const iosConfig = JSON.parse(iosConfigText);
  if (iosConfig.server?.url || iosConfigText.includes("lovableproject") || iosConfigText.includes("lovable.app")) {
    throw new Error("iOS native-konfig innehåller fortfarande server.url/extern Lovable-länk.");
  }
  if (!existsSync(iosPublicIndexPath)) {
    throw new Error("Saknar ios/App/App/public/index.html — webbundlen är inte synkad till Xcode.");
  }
  const storyboardText = readFileSync(storyboardPath, "utf8");
  if (!storyboardText.includes("ToddyBridgeViewController")) {
    throw new Error("iOS använder inte ToddyBridgeViewController — native navigation guard saknas.");
  }
  console.log("✅ Verifierat: iOS kör bundled app inne i WebView med native guard mot externa URL:er.");
}

const configPath = path.resolve("capacitor.config.json");
removeServerUrl(configPath);

console.log("✅ iPhone dev-läge: lokal bundled app, ingen extern server.url");
if (!existsSync(path.resolve("ios"))) {
  console.log("iOS-projekt saknas lokalt. Skapar ett rent iOS-projekt...");
  await run("npx", ["cap", "add", "ios"]);
}

console.log("Bygger webben och synkar till Xcode...");
await run("npm", ["run", "build"]);
await run("npx", ["cap", "sync", "ios"]);
await run("node", ["scripts/install-ios-native-guard.mjs"]);
removeServerUrl(configPath);
removeServerUrl(path.resolve("ios/App/App/capacitor.config.json"));
verifyNativeBundle();
removeAppDerivedData();

console.log("Öppnar Xcode. Tryck Play på din iPhone därifrån.");
await run("npx", ["cap", "open", "ios"]);

console.log("\n✅ Klart. Efter framtida ändringar: kör npm run cap:dev:ios igen och tryck Play i Xcode.");