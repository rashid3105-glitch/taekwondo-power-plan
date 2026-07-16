import UIKit
import Capacitor

@objc(MainViewController)
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        NSLog("[SportstalentHealthKit] MainViewController.capacitorDidLoad invoked")

        guard let bridge = bridge else {
            NSLog("[SportstalentHealthKit] Registration failed: bridge is nil")
            return
        }

        bridge.registerPluginInstance(SportstalentHealthKit())

        let registered = bridge.plugin(withName: "SportstalentHealthKit") != nil
        NSLog("[SportstalentHealthKit] Registered in Capacitor bridge: \(registered)")
    }
}