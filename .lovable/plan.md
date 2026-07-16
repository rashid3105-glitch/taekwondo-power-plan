## Diagnosis

The issue is not HealthKit permission or JavaScript naming. `UNIMPLEMENTED` means Capacitor’s native registry does not contain a plugin whose `jsName` is `SportstalentHealthKit` when the web layer calls `registerPlugin("SportstalentHealthKit")`.

The current native setup is mixed:

- Capacitor 8 SPM projects register package plugins from the generated native `capacitor.config.json` `packageClassList`, or from explicit `bridge.registerPluginInstance(...)` in the active `CAPBridgeViewController`.
- Legacy `CAP_PLUGIN(...)` Objective-C registration can compile but is not a reliable registration path for this Capacitor 8 SPM setup.
- The sandbox currently has an SPM package plugin plus manual `MainViewController` registration, while your local `git status` shows App-target Swift/Objective-C/bridging-header changes. These two approaches conflict and make it easy for the code to compile but never enter the runtime registry.

## Plan

1. **Use one canonical registration model**
   - Keep the JavaScript API unchanged: `registerPlugin("SportstalentHealthKit")`.
   - Use Capacitor 8’s Swift `CAPBridgedPlugin` model.
   - Register the plugin explicitly from the active iOS bridge controller with `bridge?.registerPluginInstance(SportstalentHealthKit())`.

2. **Remove legacy Objective-C registration**
   - Remove any `.m` file containing `CAP_PLUGIN(...)` for `SportstalentHealthKit`.
   - Remove the `App-Bridging-Header.h` if it only exists to support the legacy Objective-C plugin bridge.
   - Remove `SWIFT_OBJC_BRIDGING_HEADER` entries if they were only added for this plugin.

3. **Move/keep the plugin in the App target**
   - Ensure `ios/App/App/SportstalentHealthKit.swift` is the single native plugin implementation.
   - Make it conform to `CAPPlugin, CAPBridgedPlugin`.
   - Include:
     - `@objc(SportstalentHealthKit)`
     - `let identifier = "SportstalentHealthKit"`
     - `let jsName = "SportstalentHealthKit"`
     - `pluginMethods` for `isAvailable`, `requestAuthorization`, `queryQuantity`, `queryCategory`, and `queryWorkouts`
   - Ensure all exported methods are `@objc`.

4. **Ensure the active bridge controller registers it**
   - Keep `ios/App/App/MainViewController.swift` in the App target.
   - Confirm storyboard uses `MainViewController` as the initial bridge controller, not plain `CAPBridgeViewController`.
   - Register the plugin in `capacitorDidLoad()` after `super.capacitorDidLoad()`.

5. **Clean up the SPM package plugin path**
   - Remove `sportstalent-health-kit` from `package.json`, `package-lock.json`, and `bun.lock` if present.
   - Remove `plugins/sportstalent-health-kit` if it is no longer used.
   - Remove the `SportstalentHealthKit` dependency/product from `ios/App/CapApp-SPM/Package.swift` so native registration does not depend on generated package auto-discovery.

6. **Audit Xcode project membership**
   - Ensure `SportstalentHealthKit.swift` and `MainViewController.swift` are in the App target Sources build phase.
   - Ensure no stale references remain to the deleted `.m`, bridging header, or package plugin.

7. **Verification path**
   - After implementation, locally run:
     - `git pull`
     - `npm install`
     - `npm run build`
     - `npx cap sync ios`
     - Clean build folder in Xcode, then rebuild/run.
   - Confirm native logs show the app is using `MainViewController` and that `SportstalentHealthKit` is registered before the web app calls HealthKit.

## Expected result

`registerPlugin("SportstalentHealthKit")` will resolve to the native Swift plugin instance instead of returning `UNIMPLEMENTED`, with no JavaScript API change.

## Recovery options

If the issue persists after this cleanup, use History to compare/restore the last known native state before the plugin migration:

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

After native Capacitor changes, also review the Capacitor blog/docs before testing again.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>