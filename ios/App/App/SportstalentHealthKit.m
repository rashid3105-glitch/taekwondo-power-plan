#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Bridges the Swift SportstalentHealthKit class into Capacitor's plugin
// registry. Method names MUST match the @objc func names in the Swift file.
CAP_PLUGIN(SportstalentHealthKit, "SportstalentHealthKit",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(queryQuantity, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(queryCategory, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(queryWorkouts, CAPPluginReturnPromise);
)
