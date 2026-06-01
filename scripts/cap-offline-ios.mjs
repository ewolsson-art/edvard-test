#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const BUILD_ID = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const OFFLINE_APP_ID = "app.lovable.edvardtest.offline";
const OFFLINE_APP_NAME = "Toddy";
const OFFLINE_MARKER = `OFFLINE_IOS_${BUILD_ID}`;

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
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function patchRootConfig() {
  const configPath = path.resolve("capacitor.config.json");
  const cfg = readJson(configPath);
  cfg.appId = OFFLINE_APP_ID;
  cfg.appName = OFFLINE_APP_NAME;
  delete cfg.server;
  writeJson(configPath, cfg);
  console.log(`✅ Offline app-id: ${OFFLINE_APP_ID}`);
}

function patchWebMarker() {
  writeFileSync(path.resolve("src/nativeBuildMarker.ts"), `export const NATIVE_BUILD_MARKER = "${OFFLINE_MARKER}";\n`);
  console.log(`✅ Web-markör: ${OFFLINE_MARKER}`);
}

function removeIosProject() {
  const iosPath = path.resolve("ios");
  if (existsSync(iosPath)) {
    rmSync(iosPath, { recursive: true, force: true });
    console.log("✅ Tog bort gamla ios/-projektet lokalt");
  }
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

function patchPlistValue(text, key, value) {
  const pattern = new RegExp(`(<key>${key}</key>\\s*<string>)([^<]*)(</string>)`);
  return text.replace(pattern, `$1${value}$3`);
}

function patchNativeIdentityAndConfig() {
  const nativeConfigPath = path.resolve("ios/App/App/capacitor.config.json");
  const plistPath = path.resolve("ios/App/App/Info.plist");
  const projectPath = path.resolve("ios/App/App.xcodeproj/project.pbxproj");

  const nativeCfg = readJson(nativeConfigPath);
  nativeCfg.appId = OFFLINE_APP_ID;
  nativeCfg.appName = OFFLINE_APP_NAME;
  delete nativeCfg.server;
  writeJson(nativeConfigPath, nativeCfg);

  let plist = readFileSync(plistPath, "utf8");
  plist = patchPlistValue(plist, "CFBundleDisplayName", OFFLINE_APP_NAME);
  plist = patchPlistValue(plist, "CFBundleName", OFFLINE_APP_NAME);
  writeFileSync(plistPath, plist);

  let project = readFileSync(projectPath, "utf8");
  project = project.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${OFFLINE_APP_ID};`);
  writeFileSync(projectPath, project);

  console.log("✅ Native identitet och config låst till offline-läge");
}

function fileContains(filePath, needle) {
  return existsSync(filePath) && readFileSync(filePath, "utf8").includes(needle);
}

function treeContains(dirPath, needle) {
  for (const entry of readdirSync(dirPath, { recursive: true })) {
    const filePath = path.join(dirPath, String(entry));
    try {
      if (readFileSync(filePath, "utf8").includes(needle)) return true;
    } catch {
      // ignore directories and binary files
    }
  }
  return false;
}

function verifyOfflineBundle() {
  const requiredPaths = [
    "ios/App/App/capacitor.config.json",
    "ios/App/App/public/index.html",
    "ios/App/App/public/assets",
    "ios/App/App/Base.lproj/Main.storyboard",
    "ios/App/App/Info.plist",
    "ios/App/App.xcodeproj/project.pbxproj",
  ];

  for (const relativePath of requiredPaths) {
    if (!existsSync(path.resolve(relativePath))) throw new Error(`Saknas efter offline-sync: ${relativePath}`);
  }

  const nativeConfigText = readFileSync(path.resolve("ios/App/App/capacitor.config.json"), "utf8");
  const nativeConfig = JSON.parse(nativeConfigText);
  if (nativeConfig.server?.url || /192\.168\.|server"\s*:|lovableproject|lovable\.app/i.test(nativeConfigText)) {
    throw new Error("iOS native-konfig innehåller fortfarande server.url eller extern länk.");
  }

  if (!fileContains(path.resolve("ios/App/App/Base.lproj/Main.storyboard"), "ToddyBridgeViewController")) {
    throw new Error("Main.storyboard använder inte ToddyBridgeViewController.");
  }
  if (!fileContains(path.resolve("ios/App/App/Info.plist"), OFFLINE_APP_NAME)) {
    throw new Error("Info.plist visar inte Toddy.");
  }
  if (!fileContains(path.resolve("ios/App/App.xcodeproj/project.pbxproj"), OFFLINE_APP_ID)) {
    throw new Error("Xcode-projektet har inte offline bundle id.");
  }
  if (!treeContains(path.resolve("ios/App/App/public"), OFFLINE_MARKER)) {
    throw new Error("Webbundlen innehåller inte den nya offline-markören.");
  }

  console.log("✅ Verifierat: appen är en ny offline-WebView utan 192.168/server.url.");
}

mkdirSync(path.resolve("src"), { recursive: true });
patchRootConfig();
patchWebMarker();
removeIosProject();

await run("npm", ["run", "build"]);
await run("npx", ["cap", "add", "ios"]);
await run("npx", ["cap", "sync", "ios"]);
await run("node", ["scripts/install-ios-native-guard.mjs"]);
patchNativeIdentityAndConfig();
removeAppDerivedData();
verifyOfflineBundle();

console.log("\n✅ Offline iOS-projekt klart.");
console.log("Öppnar Xcode. Välj App → iPhone och tryck Play.");
await run("npx", ["cap", "open", "ios"]);