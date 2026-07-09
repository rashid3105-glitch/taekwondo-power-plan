# Fix: iPhone (native) viser blank sk\u00e6rm

## Diagnose

Sk\u00e6rmbilledet + konsollens `Unknown message type: RESET_BLANK_CHECK` (Capacitors indbyggede blank-sk\u00e6rm watchdog) viser at hele React-appen aldrig monterer p\u00e5 din iOS-build \u2014 det er ikke chat-funktionen der er brudt, men bootstrap.

Skyldig: `src/main.tsx` mounter React inde i en `async` IIFE der f\u00f8rst `await`er to Capacitor-Preferences-kald:

```ts
await Promise.all([
  hydrateAuthFromPreferences(),
  hydrateLangFromPreferences(),   // ny \u2014 tilf\u00f8jet i sidste omgang
]);
createRoot(...).render(<App />);
```

`hydrateLangFromPreferences` bruger `@capacitor/preferences` \u2014 en plugin der blev tilf\u00f8jet i package.json men som **ikke** findes i den .ipa der k\u00f8rer p\u00e5 din telefon (pods er ikke synket siden). N\u00e5r JS-bridgen kalder en plugin der ikke er installeret nativt, kan promisen h\u00e6nge for evigt p\u00e5 nogle iOS-versioner i stedet for at reject\u2019e \u2014 s\u00e5 `render()` kaldes aldrig, og WebView\u2019en forbliver blank.

Samme risiko g\u00e6lder fremadrettet enhver ny plugin.

## L\u00f8sning (kode)

1. **`src/main.tsx`** \u2014 g\u00f8r render robust:
   - Wrap hydrations i `Promise.race` med 1500 ms timeout, s\u00e5 React altid mounter selv hvis en native bridge h\u00e6nger.
   - Fang eventuelle rejections eksplicit s\u00e5 en fejlende hydration ikke blokerer mount.
   - K\u00f8r render f\u00f8rst, hydration-bindingen (`bindAuthPersistence`) efter \u2014 uden \u00e6ndring af r\u00e6kkef\u00f8lgen for auth-token-hydration (den beh\u00f8ves f\u00f8r mount for at undg\u00e5 flicker af login-sk\u00e6rmen).

2. **`index.html`** \u2014 tilf\u00f8j en minimal inline-fallback der viser en simpel besked hvis `#root` er tomt efter ~5s (ren defensiv sikkerhedsnet s\u00e5 en fremtidig bootstrap-fejl aldrig igen bliver en helt sort sk\u00e6rm p\u00e5 native).

Ingen \u00e6ndringer til chat-koden \u2014 chat virker n\u00e5r appen f\u00f8rst monterer.

## Bagefter (du selv i Xcode)

For at f\u00e5 fixet + `@capacitor/preferences`-pluginet ind i den native binary:

```
npm install
npm run build
npx cap sync ios
npx cap open ios     # byg + k\u00f8r fra Xcode
```

Uden `cap sync` er telefonen stadig p\u00e5 gammel bundle.

## Files touched

- `src/main.tsx` \u2014 timeout-hardened bootstrap
- `index.html` \u2014 5s blank-sk\u00e6rm fallback besked
