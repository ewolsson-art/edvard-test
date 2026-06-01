#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const storyboardPath = path.resolve("ios/App/App/Base.lproj/Main.storyboard");
const projectPath = path.resolve("ios/App/App.xcodeproj/project.pbxproj");

const bridgePath = path.resolve("ios/App/App/ToddyBridgeViewController.swift");
const guardPath = path.resolve("ios/App/App/ToddyNavigationGuardPlugin.swift");

const bridgeSwift = `import UIKit
import Capacitor
import WebKit

@objc(ToddyBridgeViewController)
class ToddyBridgeViewController: CAPBridgeViewController {
    override open func instanceDescriptor() -> InstanceDescriptor {
        let descriptor = super.instanceDescriptor()

        // Hard reset every launch: the app must boot from the bundled
        // capacitor://localhost app, never from a persisted remote URL/snapshot.
        descriptor.serverURL = nil
        descriptor.urlScheme = "capacitor"
        descriptor.urlHostname = "localhost"
        descriptor.appStartPath = nil
        KeyValueStore.standard["serverBasePath"] = nil as String?

        return descriptor
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        KeyValueStore.standard["serverBasePath"] = nil as String?
        bridge?.registerPluginInstance(ToddyNavigationGuardPlugin())
        CAPLog.print("🛡️ Toddy native guard active: bundled capacitor://localhost only")
    }

    override open func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = false
        webView?.isOpaque = false
        webView?.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1)
        webView?.scrollView.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1)
    }
}
`;

const guardSwift = `import Foundation
import Capacitor
import WebKit

@objc(ToddyNavigationGuardPlugin)
public class ToddyNavigationGuardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ToddyNavigationGuardPlugin"
    public let jsName = "ToddyNavigationGuard"
    public let pluginMethods: [CAPPluginMethod] = []

    override public func shouldOverrideLoad(_ navigationAction: WKNavigationAction) -> NSNumber? {
        guard let url = navigationAction.request.url else { return nil }

        let isTopLevel = navigationAction.targetFrame == nil || navigationAction.targetFrame?.isMainFrame == true
        guard isTopLevel else { return nil }

        let scheme = (url.scheme ?? "").lowercased()
        let host = (url.host ?? "").lowercased()
        let absolute = url.absoluteString.lowercased()

        let isBundledApp = scheme == "capacitor" && host == "localhost"
        let isSafeInternalScheme = scheme == "about" || scheme == "blob" || scheme == "data"

        if isBundledApp || isSafeInternalScheme {
            return false
        }

        // This is the new strategy: never let Capacitor fall through to
        // UIApplication.shared.open(...), which is what opens Safari/external links.
        if scheme == "http" || scheme == "https" || absolute.contains("lovableproject") || absolute.contains("lovable.app") {
            CAPLog.print("🛑 Blocked external top-level navigation: \(url.absoluteString)")
            if let startURL = bridge?.config.serverURL {
                DispatchQueue.main.async { [weak self] in
                    self?.bridge?.webView?.load(URLRequest(url: startURL))
                }
            }
            return true
        }

        return nil
    }
}
`;

function writeIfChanged(filePath, content) {
  if (!existsSync(filePath) || readFileSync(filePath, "utf8") !== content) {
    writeFileSync(filePath, content);
    console.log(`✅ Skrev ${path.relative(process.cwd(), filePath)}`);
  }
}

function patchStoryboard() {
  if (!existsSync(storyboardPath)) return;
  let text = readFileSync(storyboardPath, "utf8");
  const before = text;

  text = text.replace(
    /customClass="CAPBridgeViewController" customModule="Capacitor"/g,
    'customClass="ToddyBridgeViewController" customModule="App" customModuleProvider="target"'
  );

  if (text !== before) {
    writeFileSync(storyboardPath, text);
    console.log("✅ Main.storyboard använder ToddyBridgeViewController");
  }
}

function insertOnce(text, marker, insertion) {
  if (text.includes(insertion.trim())) return text;
  return text.replace(marker, `${insertion}${marker}`);
}

function patchProject() {
  if (!existsSync(projectPath)) return;
  let text = readFileSync(projectPath, "utf8");
  const before = text;

  text = insertOnce(
    text,
    "/* End PBXBuildFile section */",
    "\t\tA11100000000000000000001 /* ToddyBridgeViewController.swift in Sources */ = {isa = PBXBuildFile; fileRef = A11100000000000000000002 /* ToddyBridgeViewController.swift */; };\n\t\tA11100000000000000000003 /* ToddyNavigationGuardPlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = A11100000000000000000004 /* ToddyNavigationGuardPlugin.swift */; };\n"
  );
  text = insertOnce(
    text,
    "/* End PBXFileReference section */",
    "\t\tA11100000000000000000002 /* ToddyBridgeViewController.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ToddyBridgeViewController.swift; sourceTree = \"<group>\"; };\n\t\tA11100000000000000000004 /* ToddyNavigationGuardPlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ToddyNavigationGuardPlugin.swift; sourceTree = \"<group>\"; };\n"
  );

  if (!text.includes("A11100000000000000000002 /* ToddyBridgeViewController.swift */,")) {
    text = text.replace(
      "\t\t\t\t504EC3071FED79650016851F /* AppDelegate.swift */,",
      "\t\t\t\t504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\tA11100000000000000000002 /* ToddyBridgeViewController.swift */,\n\t\t\t\tA11100000000000000000004 /* ToddyNavigationGuardPlugin.swift */,"
    );
  }

  if (!text.includes("A11100000000000000000001 /* ToddyBridgeViewController.swift in Sources */,")) {
    text = text.replace(
      "\t\t\t\t504EC3081FED79650016851F /* AppDelegate.swift in Sources */,",
      "\t\t\t\t504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\tA11100000000000000000001 /* ToddyBridgeViewController.swift in Sources */,\n\t\t\t\tA11100000000000000000003 /* ToddyNavigationGuardPlugin.swift in Sources */,"
    );
  }

  if (text !== before) {
    writeFileSync(projectPath, text);
    console.log("✅ Xcode-projektet inkluderar native navigation guard");
  }
}

writeIfChanged(bridgePath, bridgeSwift);
writeIfChanged(guardPath, guardSwift);
patchStoryboard();
patchProject();

console.log("✅ Native iOS guard installerad");