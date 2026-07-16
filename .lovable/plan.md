## Findings from source verification

- `SportstalentHealthKit` is on the Capacitor 8 manual registration path: `MainViewController.capacitorDidLoad()` calls `bridge?.registerPluginInstance(SportstalentHealthKit())`.
- `MainViewController` is wired as the active root controller: `Info.plist` uses `UIMainStoryboardFile = Main`, and `Main.storyboard` sets the initial view controller to `customClass="MainViewController"` with module `App`.
- `SportstalentHealthKit.swift` is in the App target Sources build phase together with `MainViewController.swift`.
- The plugin class conforms to `CAPPlugin, CAPBridgedPlugin` and exposes `jsName = "SportstalentHealthKit"` plus `pluginMethods` including `requestAuthorization`.
- I cannot truthfully confirm `Capacitor.isPluginAvailable("SportstalentHealthKit") === true` from this web sandbox, because that value is produced inside the iOS WebView at runtime. Source-level wiring says it should be true; the native runtime must be instrumented to prove it on-device.

## Plan

1. Add explicit native runtime verification in `MainViewController.swift`:
   - Log when `MainViewController.capacitorDidLoad()` runs.
   - Register `SportstalentHealthKit` with `bridge?.registerPluginInstance(...)`.
   - Immediately check `bridge?.plugin(withName: "SportstalentHealthKit") != nil` and log success/failure.

2. Add a defensive JS availability check in `src/lib/healthkit.ts` before `requestAuthorization(...)`:
   - Call `Capacitor.isPluginAvailable("SportstalentHealthKit")`.
   - If false, return a clear `plugin_not_registered` reason instead of only surfacing raw `UNIMPLEMENTED`.
   - Log native platform, iOS status, and plugin availability for debugging.

3. Keep the public JS API unchanged:
   - Continue using `registerPlugin("SportstalentHealthKit")`.
   - Do not rename methods or change call sites.

4. Verify by static checks:
   - Confirm no legacy `CAP_PLUGIN(...)`, bridging header, or stale local package references are still participating.
   - Confirm `MainViewController.swift` and `SportstalentHealthKit.swift` remain in the App target Sources build phase.

5. On-device validation steps after implementation:
   - Run `npm run build && npx cap sync ios`.
   - Clean Xcode build folder / delete DerivedData if needed.
   - Launch the iOS app and confirm logs show `MainViewController.capacitorDidLoad` and `SportstalentHealthKit registered: true` before calling HealthKit.
   - In the WebView console, confirm `Capacitor.isPluginAvailable("SportstalentHealthKit")` returns `true`.