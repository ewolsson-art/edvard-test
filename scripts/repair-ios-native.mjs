import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const rootConfigPath = "capacitor.config.json";
const iosConfigPath = "ios/App/App/capacitor.config.json";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

const rootConfig = readJson(rootConfigPath);
delete rootConfig.server;
writeJson(rootConfigPath, rootConfig);
console.log(`Removed server.url from ${rootConfigPath}`);

if (existsSync(iosConfigPath)) {
  const iosConfig = readJson(iosConfigPath);
  delete iosConfig.server;
  writeJson(iosConfigPath, iosConfig);
  console.log(`Removed server.url from ${iosConfigPath}`);
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

console.log("iOS repair complete. Appen kör nu bundled inne i Xcode, utan extern Lovable-länk.");