# Kaniyan · கணியன்

**Free jathagam and porutham for every astrologer.** An initiative to free astrologers from costly astrology software. No fee, no subscription, no ads, no watermark.
ஜோதிடர்களுக்கான இலவச ஜாதகம் மற்றும் திருமணப் பொருத்தம் செயலி.

**Use it now: https://saz-io.github.io/kaniyan/** (open the app from the page; on a phone, use "Add to Home Screen" to install it and use it offline).

## Features
- Jathagam: rasi and navamsa charts, planet positions, panchangam, dasa and bhukti (Swiss Ephemeris)
- Thirumana porutham with a score and a per-porutham explanation
- Your own name, phone, address and logo on every PDF report
- Tamil and English, runs entirely in the browser, client details never leave the device
- Works offline after the first visit

## Project layout
| Path | What it is |
|---|---|
| `web-src/` | The app: plain HTML, JS and WebAssembly. No build step. |
| `docs/` | The website (GitHub Pages). `docs/app/` is a generated copy of `web-src/`. |
| `tools/sync-site.sh` | Copies `web-src/` to `docs/app/` and rebuilds the offline cache list. |
| `tools/build_places.py` | Builds `places.json` from GeoNames dumps. |
| `tests/` | Engine checks (`node tests/golden.mjs | python tests/compare.py`). |
| `android/` | Old Android WebView wrapper. Not maintained; the web app replaces it. |

## Run locally
```
cd web-src && python3 -m http.server 8000     # open http://localhost:8000
```

## Change the app
Edit `web-src/`, then from the repo root run `tools/sync-site.sh` and commit `docs/`. Skipping the sync leaves the live site on the old version.

## License
GNU AGPL v3 (see `LICENSE`), because the app includes the Swiss Ephemeris (AGPL/GPL). Anyone using the hosted app can get the full source here.
Place data © [GeoNames](https://www.geonames.org), CC-BY 4.0.

## Support
Kaniyan stays free. If it helps you, an optional tip via UPI (`saz@slc`) keeps it going.
