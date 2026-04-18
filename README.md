# PSI Slope Calculator

Field-tech tool for capturing a sonde-and-grade slope survey on site and
producing a precise lateral-slope number for inclusion in a PSI report.

Standalone today. Designed to drop into the PSI field-tech PWA tomorrow.

---

## What it does

Walks the technician through entering measurement-station data (cumulative
distance, laser rod reading, locator depth-to-sonde) and computes:

- Overall slope (%) and inches-per-foot from first to last station
- Per-segment slopes between every adjacent pair of stations
- Belly identification (any segment where the downstream invert is higher
  than the upstream invert)
- Pipe invert profile chart
- Code-comparison verdict against the configured pipe diameter
  (4″ → 2.083% min, 6″ → 1.042% min)

Exports a JSON payload of the survey + computed result for handoff to the
report generator.

---

## Sonde-and-grade method (what the tech is collecting)

This calculator implements the standard sonde-and-grade survey used for
municipal lateral-slope acceptance testing. Gear required:

- Camera with integrated 512 Hz sonde (PSI: existing SewerScope rig)
- RIDGID SR-series locator (or equivalent) with depth readout
- Rotary laser level + grade rod (rentable from any tool yard)
- Tape measure or chalk for surface marks

Field procedure:

1. Push camera head to first measurement station inside the lateral.
2. Surface-locate the sonde with the receiver. Mark the spot on the surface
   with paint or chalk.
3. With the rotary laser level set up on a stable point with line-of-sight
   to all marks, take a rod reading at the surface mark.
4. Read depth-to-sonde from the locator and record it.
5. Note the cumulative distance from the cleanout (rod counter or tape).
6. Push the camera to the next station and repeat. Aim for a station every
   1.5–3 m (5–10 ft) of run, more densely around suspected bellies.

The calculator handles the math (see `src/slope/calc.ts` for the derivation
and `src/slope/__tests__/calc.test.ts` for the verification).

---

## Standalone usage

```bash
cd /Volumes/Storage/PSI/tools/slope-calculator
npm install
npm run dev      # opens on http://localhost:17448
npm test         # runs the calc unit tests
npm run build    # production build into ./dist
```

The standalone build is fully self-contained — open `dist/index.html` in
any browser and the app works offline. Useful as an emergency-fallback
tool on a tablet that hasn't gotten the latest PWA build yet.

---

## Snapping it into the PWA later

The entire snap-in surface lives under `src/slope/`. **Nothing outside that
folder needs to come along.** The standalone shell (`src/main.tsx`,
`index.html`, build config) is just a host for development.

### Step 1 — Copy the module

Copy `src/slope/` into the PWA repo at a location of your choice, e.g.:

```
psi-pwa/src/features/slope/   ← from this repo's src/slope/
```

The directory contains:

```
slope/
├── index.ts                    ← public API (import from here only)
├── SlopeCalculator.tsx         ← React component
├── calc.ts                     ← pure calculation (no React, no DOM)
├── types.ts                    ← TypeScript types
├── styles.css                  ← scoped under .psi-slope, no leakage
└── __tests__/calc.test.ts      ← Vitest unit tests
```

### Step 2 — Verify peer dependencies

The module needs:

- `react` >= 18
- `react-dom` >= 18
- TypeScript >= 5.0 (any strict-mode-friendly config)

It uses **no** runtime dependencies beyond React. No state library, no
charting library, no styling framework. The SVG profile chart is hand-rolled.

### Step 3 — Mount the component

```tsx
import { SlopeCalculator } from "@/features/slope";
import type { ExportPayload } from "@/features/slope";

export function SlopeSurveyPage({ jobId }: { jobId: string }) {
  const handleComplete = async (payload: ExportPayload) => {
    await fetch(`/api/jobs/${jobId}/slope-survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  return (
    <SlopeCalculator
      initialJobId={jobId}
      initialUnits="imperial"
      pipeDiameterIn={4}
      onComplete={handleComplete}
    />
  );
}
```

### Step 4 — Wire persistence

Two integration points:

| Prop          | When it fires                            | Wire it to                |
|---------------|------------------------------------------|---------------------------|
| `onChange`    | Every state change (debounced 1 frame)   | Auto-save / draft cache   |
| `onComplete`  | Tech taps "Export survey JSON"           | Submit-to-backend handler |

Both receive the same data shape. `onChange` keeps the PWA's local cache
warm so a network drop doesn't lose the survey; `onComplete` is the
explicit submit gate. The standalone shell also triggers a JSON file
download in `onComplete` — feel free to remove that behavior in the PWA
shell since the backend will own persistence.

### Step 5 — Tests

The calc tests are framework-agnostic Vitest. They have **no React import**
and **no DOM dependency**. Drop them into the PWA's existing Vitest /
Jest setup and they should run without modification (rename `vitest`
imports to `@jest/globals` if the PWA uses Jest).

### Step 6 — Styling

`styles.css` defines all selectors under `.psi-slope`. The component
applies that class to its root, so styles cannot leak into the host PWA's
style space. If the PWA wraps everything in a global theme, the
calculator will still render in PSI brand colors — the CSS custom
properties are scoped to `.psi-slope`.

To re-theme (e.g., for a future white-label deployment), override the
custom properties on the host:

```css
.psi-slope {
  --psi-p900: #0f172a;     /* override primary */
  --psi-accent: #d946ef;   /* override accent */
}
```

---

## API reference (what `index.ts` exports)

### Component

```ts
<SlopeCalculator
  initialJobId?: string
  initialUnits?: "imperial" | "metric"
  pipeDiameterIn?: 4 | 6
  onChange?: (survey: Survey) => void
  onComplete?: (payload: ExportPayload) => void
/>
```

### Pure functions (no React)

```ts
computeSurvey(survey: Survey, opts?: CalcOptions): SurveyResult
computeSegment(upstream: Station, downstream: Station): Segment
classifySlope(pct: number, opts?: CalcOptions): SlopeVerdict
slopePctToInPerFt(pct: number): number
unitShort(units: Units): { distance: string; depth: string }
validate(survey: Survey): string[]
```

### Types

`Station`, `Survey`, `SurveyResult`, `Segment`, `SlopeVerdict`, `Units`

All exported from `@/features/slope` (or whatever path the PWA puts the
module under).

---

## Calculation derivation (for the curious / for code review)

Given a horizontal laser plane at height-of-instrument `HI`, for any
station `N` on the surface:

```
ground_elev(N) = HI − rod(N)
invert_elev(N) = ground_elev(N) − depth(N)
              = HI − rod(N) − depth(N)
```

Pipe drop between upstream station `a` and downstream station `b`:

```
drop = invert_elev(a) − invert_elev(b)
     = (rod(b) − rod(a)) + (depth(b) − depth(a))
```

Slope as a percentage:

```
slope% = (drop ÷ horizontal_distance) × 100
```

Sign convention: positive slope means the downstream invert is **lower**
than the upstream invert — i.e., gravity pulls flow from a to b. Negative
slope between adjacent stations indicates a **belly**.

---

## Constraints honored

- No external runtime dependencies beyond React.
- No global CSS leakage — all styles scoped under `.psi-slope`.
- Pure calculation isolated from UI for easy unit testing.
- TypeScript strict mode clean.
- Production bundle ~50 KB gzipped.
- Module boundary is the `src/slope/` directory; everything else is
  standalone scaffolding the PWA can ignore.

---

## Files

```
slope-calculator/
├── README.md                          ← this file
├── package.json                       ← standalone scaffolding
├── tsconfig.json                      ← standalone scaffolding
├── vite.config.ts                     ← standalone scaffolding
├── index.html                         ← standalone scaffolding
└── src/
    ├── main.tsx                       ← standalone entry; ignore for PWA
    └── slope/                         ← THIS IS THE MODULE — copy this
        ├── index.ts
        ├── SlopeCalculator.tsx
        ├── calc.ts
        ├── types.ts
        ├── styles.css
        └── __tests__/
            └── calc.test.ts
```
