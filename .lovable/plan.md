## Root cause (bekræftet af video)

Efter "Use Photo" lander brugeren tilbage på nutrition-forsiden — ikke hvid skærm, ikke bibliotek-roden. URL'en `/library/nutrition` er intakt, men `nutritionView`-state i `Library.tsx` er nulstillet fra `"logger"` til `"home"`. Det betyder: **WKWebView blev genstartet af iOS mens Camera UI lå foran**, og det ventende `Camera.getPhoto()`-promise blev tabt sammen med al React state. Base64-fixet i sidste runde løste intet fordi problemet ikke er en JS-crash — det er en OS-drevet WebView-reload.

## Fix (3 ændringer)

### 1. Skift Camera til `presentationStyle: 'popover'` + lavere kvalitet (`src/components/FoodScanner.tsx`)
`fullscreen` presentation-mode skubber WebView'en helt i baggrunden på iOS og er hovedårsagen til at OS'et smider den ud. `popover` holder WebView'en synlig bagved kameraet og reducerer drastisk sandsynligheden for at den killes. Samtidig sænkes `quality` fra nuværende værdi til `70` og `width: 1280` for at holde base64-payloaden lille.

```ts
await Camera.getPhoto({
  quality: 70,
  width: 1280,
  resultType: CameraResultType.Base64,
  source: fromCamera ? CameraSource.Camera : CameraSource.Photos,
  presentationStyle: 'popover',
  correctOrientation: true,
});
```

### 2. Persister `nutritionView` i sessionStorage (`src/pages/Library.tsx`)
Selv med popover-mode kan WebView'en stadig blive killed på pressede enheder. For at gøre flowet robust: gem `nutritionView` i `sessionStorage` når den ændres, og rehydrer ved mount. Hvis Camera kommer tilbage efter en reload, lander brugeren stadig i `logger`-viewet i stedet for på home-menuen. Photoen fra det tabte Camera-promise er stadig væk, men brugeren ser ikke ud som om "intet skete" — de er stadig i scanner-viewet klar til at prøve igen. Nøgle: `scanner:nutrition_view`, ryddes ved unmount af Library.

### 3. Tilføj den manglende oversættelsesnøgle `foodScanUpload` på alle 7 sprog (`src/i18n/translations.ts`)
På screenshotet vises den rå nøgle `foodScanUpload` i knappen — nøglen findes ikke i `translations.ts`. Tilføjes ved siden af `foodScanTake` på alle 7 locales (da/en/sv/de/ar/no/es).

## Ikke-ændringer

- `App.tsx` resume-route-guarden røres ikke — den er irrelevant fordi URL'en allerede bevares.
- Ingen `Preferences`-baseret photo-persistens — det tabte Camera-promise kan ikke reddes; vi accepterer at brugeren i værste fald skal trykke "Take photo" én gang til, men de er nu i det rigtige view.
- Ingen ændringer i web-flowet.
- Ingen ændringer i edge-funktioner eller database.
- Ingen ny changelog-entry (afventer verificering på native build først).

## Verificering efter build

- **Hvis kameraet nu kommer tilbage med billedet → problem løst**, popover-mode holdt WebView'en i live.
- **Hvis brugeren stadig lander i logger-view uden billede → WebView blev alligevel killed**, men persistensen sikrer at de er i rigtigt view; næste skridt vil være at gemme photo-blob i IndexedDB via en `App.addListener('appRestoredResult')`-lignende bridge.
- **Hvis skærmen er helt hvid → JS-crash**, ErrorBoundary'en fra sidste runde viser fejlteksten.
