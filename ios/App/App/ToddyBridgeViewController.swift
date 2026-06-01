import UIKit
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
