# WattsMyLab

"Watts my lab costing me?" A free, no-login calculator that tells homelabbers what their kit costs to run each year and whether replacing it would pay off.

Phase 1: the power and cost calculator, device pages and methodology page. Fully static (Next.js `output: "export"`), all maths in the browser, setups shared via the URL.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest: formulas, URL encoding, reducer, data schema
npm run build      # validates data, then writes the static site to out/
npm run e2e        # Playwright smoke tests against out/ (run build first)
```

If Chromium is already installed somewhere, `PW_CHROMIUM_PATH=/path/to/chrome npm run e2e` skips `playwright install`.

## Layout

| Path | What |
| --- | --- |
| `app/page.tsx` | Calculator page (renders `components/Calculator.tsx`) |
| `app/devices/[slug]/page.tsx` | One static page per preset, with UK / US / DE running costs |
| `app/about/page.tsx` | How the numbers are calculated |
| `app/sitemap.ts`, `app/robots.ts` | Generated from the data files |
| `data/devices/*.json` | Presets, one file per category |
| `data/regions.json` | Countries, currency, locale, default price per kWh and its source |
| `lib/calc.ts` | Pure calculation functions |
| `lib/share.ts` | Encode / decode setup state for `?s=` (lz-string + zod/mini) |
| `lib/reducer.ts` | Calculator state changes |
| `lib/schema.ts` | Zod schemas for the data files (tests and build only, kept out of the browser bundle) |
| `lib/types.ts` | Shared types and defaults |

## Data

Every preset carries a source type (measured, community, spec sheet, estimate), the config it assumes, and a last-reviewed date. **All launch presets are currently marked `estimate`**: they are typical figures for that class of hardware and should be replaced with measured or community readings as they come in. Readings come in through the GitHub issue form in `.github/ISSUE_TEMPLATE/device-reading.yml`.

Default electricity prices (reviewed 2026-10-05): Ofgem price cap Oct–Dec 2026 for GB, EIA national average (March 2026) for the US, Eurostat H2 2025 household prices for DE, FR, NL, IE, ES and IT. Review quarterly.

## Sharing

The setup is serialised to short-key JSON, leaving out anything equal to a default or to the preset, then compressed with lz-string into `?s=`. A 10-device setup is about 270 characters. Invalid links or unknown versions fall back to an empty setup with a notice.
