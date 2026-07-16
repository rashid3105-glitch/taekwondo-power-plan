import UIKit
import Capacitor
import SportstalentHealthKit

@objc(MainViewController)
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(SportstalentHealthKit())
    }
}