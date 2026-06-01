#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const BUILD_ID = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const FRESH_APP_ID = "app.lovable.edvardtest.fresh";

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

function patchCapacitorConfig() {
  const configPath = path.resolve("capacitor.config.json");
  const cfg = readJson(configPath);
  cfg.appId = FRESH_APP_ID;
  cfg.appName = "Toddy Fresh";
  delete cfg.server;
  writeJson(configPath, cfg);
  console.log(`✅ Fresh app-id: ${FRESH_APP_ID}`);
}

function patchWebMarker() {
  const markerPath = path.resolve("src/nativeBuildMarker.ts");
  writeFileSync(
    markerPath,
    `export const NATIVE_BUILD_MARKER = "FRESH_IOS_${BUILD_ID}";\n`
  );
  console.log(`✅ Web-markör: FRESH_IOS_${BUILD_ID}`);
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

function verifyFreshBundle() {
  const checks = [
    ["ios/App/App/capacitor.config.json", FRESH_APP_ID],
    ["ios/App/App/public/index.html", ""],
    ["ios/App/App/public/assets", ""],
    ["ios/App/App/Base.lproj/Main.storyboard", "ToddyBridgeViewController"],
  ];

  for (const [filePath, needle] of checks) {
    const absolutePath = path.resolve(filePath);
    if (!existsSync(absolutePath)) throw new Error(`Saknas efter fresh sync: ${filePath}`);
    if (needle && !readFileSync(absolutePath, "utf8").includes(needle)) {
      throw new Error(`${filePath} saknar ${needle}`);
    }
  }

  const publicDir = path.resolve("ios/App/App/public");
  const publicText = readdirSync(publicDir, { recursive: true }).slice(0, 300).join("\n");
  if (!publicText.includes("index") || !publicText.includes("assets")) {
    throw new Error("iOS public-bundle ser inte komplett ut.");
  }
  console.log("✅ Verifierat: ny app-id, ny webbundle, native guard och fresh marker är synkade.");
}

patchCapacitorConfig();
patchWebMarker();

if (existsSync(path.resolve("ios"))) {
  rmSync(path.resolve("ios"), { recursive: true, force: true });
  console.log("✅ Tog bort hela gamla ios/-projektet lokalt");
}

await run("npm", ["run", "build"]);
await run("npx", ["cap", "add", "ios"]);
await run("npx", ["cap", "sync", "ios"]);
await run("node", ["scripts/install-ios-native-guard.mjs"]);

removeAppDerivedData();
verifyFreshBundle();

console.log("\n✅ Fresh iOS-projekt klart.");
console.log("Nästa steg: npm run cap:open:ios");
console.log("Viktigt: välj appen 'Toddy Fresh' i Xcode och tryck Play.");