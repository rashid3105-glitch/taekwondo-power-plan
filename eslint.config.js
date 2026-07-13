import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Deno edge functions run in a different runtime (npm: specifiers,
    // Deno globals). They are not part of the Vite/browser bundle and
    // linting them with the browser config produces noise, not signal.
    ignores: [
      "dist",
      "supabase/functions/**",
      "ios/**",
      "android/**",
      "public/sw.js",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // `any` shows up frequently in Supabase RPC/JSON payload glue code
      // where the shape is dynamic. Downgrade to warn so it surfaces
      // without failing the lint gate.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-useless-escape": "warn",
      "prefer-const": "warn",
    },
  },
  {
    files: ["*.config.{ts,js}", "tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
