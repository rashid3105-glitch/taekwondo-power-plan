The `bun run lint` crash is caused by a global `ajv` override in `package.json` forcing every package — including `@eslint/eslintrc` — to use ajv 8. `@eslint/eslintrc` is only compatible with ajv 6, so it throws `TypeError: Cannot set properties of undefined (setting 'defaultMeta')`.

### Plan

1. **Remove the global ajv override**
   - Edit `package.json` and delete the `"ajv": "^8.17.1"` line from both the `overrides` and `resolutions` sections.
   - This lets Bun/npm resolve ajv normally: `@eslint/eslintrc` gets ajv 6, while packages that need ajv 8 (`workbox-build`, `@hookform/resolvers`, `@apideck/better-ajv-errors`, `fast-uri`) continue to get ajv 8 through their own declared dependencies.

2. **Re-install dependencies**
   - Run `bun install` to update `node_modules` and the lockfile (`bun.lock` / `bun.lockb`).

3. **Verify the fix**
   - Run `bun run lint` and confirm it no longer crashes with the ajv/defaultMeta error.
   - Optionally run `bun run build` to ensure the ajv change does not break the PWA/workbox build path.

### Files to edit
- `package.json`

### Commands to run
- `bun install`
- `bun run lint`
- `bun run build` (optional sanity check)

No application source code needs to change.