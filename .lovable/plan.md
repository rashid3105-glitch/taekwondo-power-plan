## What this error means

Xcode hashes `App.entitlements` at the start of the build. If anything rewrites or even re-saves that file mid-build, code signing aborts with:

> Entitlements file "App.entitlements" was modified during the build, which is not supported.

This is **not a JS/TS code problem** — nothing in the Lovable project changes entitlements. The culprit is on the iOS side, almost always one of:

1. A "Run Script" Build Phase (often a leftover `npx cap sync` or a custom script) that touches `ios/App/App/App.entitlements` while the build runs.
2. HealthKit capability being added through both Xcode UI **and** a script, so they fight.
3. `App.entitlements` is being saved by another tool (Finder, a linter, a git hook) at the moment the build starts.

## Fix plan (do these in order, stop when build succeeds)

### Step 1 — Close everything that may touch the file
- Quit any editor that has `ios/App/App/App.entitlements` open.
- In terminal, make sure no `cap sync` / `pod install` is still running.
- In Xcode: **Product → Clean Build Folder** (⇧⌘K).

### Step 2 — Remove stray "Run Script" build phases
In Xcode:
1. Select the **App** target → **Build Phases**.
2. Look for any **Run Script** phase that runs `npx cap sync`, `cap copy`, `cordova-…`, or anything that writes into `App/`.
3. If you find one, delete it. `npx cap sync` should only be run **manually from the terminal before** opening Xcode, never as a build phase.

The standard Capacitor phases that should stay:
- `[CP] Check Pods Manifest.lock`
- `[CP] Embed Pods Frameworks`
- `[CP] Copy Pods Resources`

Anything else custom that writes into the App folder is suspect.

### Step 3 — Re-sync cleanly from the terminal
From the project root:
```bash
git pull
npm install
npm run build
npx cap sync ios
```
Then open Xcode with `npx cap open ios`. Do **not** run `cap sync` again while Xcode is building.

### Step 4 — Verify entitlements are stable
1. In Xcode: **App target → Signing & Capabilities**.
2. Confirm **HealthKit** is listed exactly once.
3. Open `ios/App/App/App.entitlements` in Xcode (not Finder) and confirm it contains:
   ```xml
   <key>com.apple.developer.healthkit</key>
   <true/>
   <key>com.apple.developer.healthkit.access</key>
   <array/>
   ```
4. Save and close the file. Do not edit it again before building.

### Step 5 — Build
**Product → Build** (⌘B). It should succeed now.

### Step 6 (escape hatch, only if Steps 1–5 don't work)
In **Build Settings**, search for `CODE_SIGN_ALLOW_ENTITLEMENTS_MODIFICATION` and set it to `YES`. Apple warns this can ship a build with the wrong entitlements, so use it only to confirm the diagnosis — then go back and remove the offending script properly.

## What I will not change in code

No source files in this project cause this error, so I won't edit any `.ts/.tsx`. If after Step 3 you still see the failure, send me:
- A screenshot of the App target's **Build Phases** list, and
- The contents of `ios/App/App/App.entitlements`

and I'll point at the exact phase to remove.
