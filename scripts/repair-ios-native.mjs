import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const rootConfigPath = "capacitor.config.json";
const iosConfigPath = "ios/App/App/capacitor.config.json";
const expectedUrl = "https://98da7b9e-4e91-4e4a-9b6d-1a1ba6269510.lovableproject.com?forceHideBadge=true&native=1&native_v=20260601_1810";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

const rootConfig = readJson(rootConfigPath);
rootConfig.server = { ...(rootConfig.server ?? {}), url: expectedUrl, cleartext: true };
writeJson(rootConfigPath, rootConfig);

if (existsSync(iosConfigPath)) {
  const iosConfig = readJson(iosConfigPath);
  iosConfig.server = { ...(iosConfig.server ?? {}), url: expectedUrl, cleartext: true };
  writeJson(iosConfigPath, iosConfig);
  console.log(`Updated ${iosConfigPath}`);
} else {
  console.log(`${iosConfigPath} not found yet. Run: npx cap sync ios`);
}

const derivedDataPath = join(homedir(), "Library/Developer/Xcode/DerivedData");
if (existsSync(derivedDataPath)) {
  for (const entry of readdirSync(derivedDataPath)) {
    if (entry.startsWith("App-")) {
      rmSync(join(derivedDataPath, entry), { recursive: true, force: true });
      console.log(`Removed Xcode cache ${entry}`);
    }
  }
}

console.log("iOS repair complete. Open Xcode and run the App target again.");