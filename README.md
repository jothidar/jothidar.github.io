# கணியன் (Kaniyan) (Android)

Offline jathagam + porutham app. WebView UI (`web-src/` (minified and AES-encrypted into the APK by `tools/protect.mjs` at build time)), Swiss Ephemeris compiled to WebAssembly,
Android's print service for "Save as PDF". The engine in `www/vedic.js` mirrors the Python package in `../vedic-core`.

Build:   cd android && gradle assembleRelease   (needs Android SDK in ~/Android/Sdk, JDK 17+)
Output:  android/app/build/outputs/apk/release/app-release.apk  (signed with android/jathagam.jks)
Tests:   node tests/golden.mjs | python tests/compare.py   (JS engine == Python package)
         tests/drive.mjs drives a debug build in the emulator over DevTools (19 checks)
Places:  python tools/build_places.py   (GeoNames dumps -> www/data/places.json)

BACK UP android/jathagam.jks and android/keystore.properties: updates must be signed with the same key.
Licences: Swiss Ephemeris (AGPL/GPL), GeoNames data CC-BY 4.0 (geonames.org). Distributing the APK means offering this source.

## License
Free software under the GNU AGPL v3 (see LICENSE), because it includes the Swiss Ephemeris. The app is free with no paywall; all source is in this repository.
