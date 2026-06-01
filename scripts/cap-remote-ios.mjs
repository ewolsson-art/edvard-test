#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const port = Number(process.env.CAP_DEV_PORT || 8080);

function getLanIp() {
  const preferred = ["en0", "en1"];
  const interfaces = os.networkInterfaces();
  for (const name of preferred) {
    for (const entry of interfaces[name] ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "localhost";
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32", ...options });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} failed`))));
  });
}

function waitForServer(url) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - started > 30_000) reject(new Error(`Vite svarade inte på ${url}`));
          else setTimeout(tick, 500);
        });
    };
    tick();
  });
}

const host = process.env.CAP_DEV_HOST || getLanIp();
const nativeUrl = `http://${host}:${port}?native=1&native_dev=1`;
const configPath = path.resolve("capacitor.config.json");
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
cfg.server = { url: nativeUrl, cleartext: true };
fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");

console.log(`✅ iPhone remote reload URL: ${nativeUrl}`);
console.log("Synkar iOS-projektet...");
await run("npx", ["cap", "sync", "ios"]);

console.log("Startar lokal dev-server för iPhone...");
const vite = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", String(port)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

const stop = () => {
  vite.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await waitForServer(`http://127.0.0.1:${port}`);
console.log("Öppnar Xcode...");
await run("npx", ["cap", "open", "ios"]);

console.log("\n✅ Remote-läge körs. Om appen öppnas externt: avbryt och använd npm run cap:dev:ios i stället.");

await new Promise((resolve) => vite.on("exit", resolve));