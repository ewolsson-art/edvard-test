import Foundation
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
            CAPLog.print("🛑 Blocked external top-level navigation: (url.absoluteString)")
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
