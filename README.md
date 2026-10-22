# Latvia Data Desk

A university web development project exploring population, employment, and earnings across Latvia's
five statistical regions. The dashboard uses official statistics from Latvia's Central
Statistical Bureau and follows the Data Desk design.

The dashboard uses a light theme with a large Latvia map, a region profile, and a comparison table
for all five regions. It defaults to 2025, population, and Rīga, with one loading, refresh, and retry area.
The profile adds population share and the four leading industry groups without repeating the
table's regional figures. Industry bars use a 0–100% scale, and numbers use Latvian formatting
(`lv-LV`).

Choose a year from 2021–2025 to update the map, table, and profile. Layer buttons change the map's
colors and highlight the matching table column; Earnings selects gross monthly earnings. Select a
region on the map or in the table to update the profile and selection outline. Sorting and CSV
export come in the next step.

## Requirements

- Node.js 24; the development version is pinned in `.nvmrc`.
- npm 11.
- A modern browser and access to `https://api.stat.gov.lv` to load statistics.

If you use nvm, run `nvm install` and `nvm use` in this folder. Otherwise, install the Node version
listed in `.nvmrc`. The project checks its supported Node/npm versions when installing dependencies.

## Run locally

```sh
npm ci
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.

## Development commands

| Command                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the development server with hot reload   |
| `npm run typecheck`    | Check application and Vite configuration types |
| `npm run lint`         | Run ESLint, including React Hooks rules        |
| `npm run format`       | Format project files with Prettier             |
| `npm run format:check` | Check formatting without changing files        |
| `npm run check`        | Run formatting, lint, and type checks          |
| `npm run build`        | Check types and generate the production build  |
| `npm run preview`      | Serve the existing production build locally    |

To check the production build:

```sh
npm run check
npm run build
npm run preview
```

`npm run preview` is for local verification of `dist/`.

## Formatting in VS Code

Open the `lab-2` folder in VS Code and enable the recommended
[Prettier extension](https://github.com/prettier/prettier-vscode). The workspace settings format
supported files on every save using `.prettierrc.json` and `.editorconfig`, including four-space
indentation and semicolons in JavaScript and TypeScript. Run `npm run format` to format the whole
project. Existing `.prettierignore` rules apply.

Always use braces for `if`, `else`, and loops, including single statements. ESLint's
[`curly` rule](https://eslint.org/docs/latest/rules/curly) enforces this. With the recommended ESLint
extension enabled, VS Code applies available fixes when you save with Cmd+S or Ctrl+S.

## Project structure

```text
public/           Static assets
src/
  components/     Latvia map, region profile, and comparison table
  data/           Runtime statistics client and prepared map geometry
  styles/         Application styles
  utils/          Shared number formatting
  App.tsx         Application entry component
  main.tsx        React bootstrap
```

## Statistics at runtime

[statistics.ts](src/data/statistics.ts) fetches four tables from the
[CSB API v2](https://stat.gov.lv/en/api-un-kodu-vardnicas/api-v2), keeps them in memory, and looks up
values by region, year, and metric. All queries cover 2021–2025, the five regions, and Latvia (`LV`).
No backend, API key, or extra data library is needed. Changing year, region, or layer reads from
these responses without making additional requests.

| Table                                                                            | Data                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [IRS031](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__POP__IR__IRS/IRS031/)  | Population at the beginning of the year                                   |
| [NBA031](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__NBB__NBA/NBA031/) | Annual employment and unemployment rates, ages 15–74                      |
| [DSV041](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__DS__DSV/DSV041/)  | Annual average gross/net monthly earnings in full-time units, all sectors |
| [NBL061](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__NB__NBLA/NBL061/) | Employment by industry: published counts in thousands and percentages     |

`App.tsx` uses ordinary React state for the filters, region selection, loading, and retry feedback.
It passes values and a selection callback to the existing components. The initial load makes
four requests. Reading other years or regions reuses those responses. **Refresh data** reloads all
sources; **Retry** requests only failed sources. Failed refreshes keep earlier data. Each request
has a 15-second timeout, and there are no automatic retries.

Reloading the page clears the memory cache and needs network access again. Statistics are not
bundled with the app. Each response keeps its retrieval time and the source's update date separately
from the observation year. Missing values display as unavailable; zero remains zero.

Keep these definitions when adding dashboard features:

- Rīga region includes the city and surrounding territory. Use the published Latvia aggregate for
  national comparisons, not an average of regional rates or salaries.
- Population data for 2023–2024 were recalculated after a methodology change in 2025. Flag the
  break between 2022 and 2023 when comparing years.
- Employment and unemployment rates have different denominators. Industry employment has no
  age-group selector; its total includes unclassified activity and rounding differences.

## Region map

[LatviaMap.tsx](src/components/LatviaMap.tsx) draws five SVG paths from
[regions.json](src/data/regions.json). Region codes match those in the statistics client; names
come from its shared `REGIONS` list. Geometry is a local asset, so the map renders even when the
statistics API is unavailable. Darker blue means a higher value for the selected layer and year.
The legend spans that year's available regional minimum and maximum; its range changes with the
filters. Unavailable regions use diagonal hatching. The selection outline is separate from data
colors.

Hover, focus, or tap a region to show its exact value above the map. Click or tap to select it;
keyboard users can Tab between regions and select with Enter or Space. Escape dismisses the value
preview while a region has focus. Use **+** and **−** to zoom between 1× and 4×, drag or use arrow
keys on a focused region to pan when zoomed, and choose **Fit** to reset the view. Focusing a region
with the keyboard brings it into view. These controls preserve the selected filters and region.
On touchscreens, the fitted map allows page scrolling; zoom in to pan the map with one finger.
On phones, zoom controls sit below the map so they do not cover regions.

The [official CSB boundary archive](https://data.gov.lv/dati/eng/dataset/robezas/resource/fa44b8cd-13d5-4306-b04a-f162d6057292)
is dated **1 January 2026**, generalized at **1:2,400,000**, and published under **CC0 1.0**.
This boundary date is separate from the selected statistics year. The five region outlines were
prepared once from these boundaries and stored in a `1000 × 650` SVG coordinate space. The app uses
this fixed asset directly, with native SVG and pointer events for interaction. No map library or
geometry preparation script is needed.

## Verification

Run `npm run check` and `npm run build`. These do not need the live statistics API.
Review loading, refresh, and retry in the browser, including a blocked request or offline state.
Change years and layers, then select regions on the map and in the table. Confirm values, colors,
legend, profile, and selection stay in sync. Filters and map navigation should make no additional
statistics requests. Check keyboard access to the controls, region selection, and map panning.
Verify that zoom stays within its limits, dragging does not select a different region, and Fit
resets the view. Check touch selection and scrolling, missing-data hatching, and retry recovery.
Confirm the five labelled regions remain proportional and fit narrow screens.
Review the map/profile columns on desktop and their stacked layout on phones. The comparison table
scrolls horizontally on narrow screens, with region names pinned on the left; focus the table and
use the arrow keys to scroll. A dark system preference should still show the light interface.
The project uses direct checks without test files or a test framework.

## Local references and generated files

`drafts/` and `research/` are local design and research references. Git, ESLint, and Prettier exclude
these folders. A fresh checkout runs without them.

The selected design reference is `drafts/04-data-desk-v2.html` when those local files are available.
Application code contains the query definitions and source links; interpretation notes are recorded
above. Raw statistical responses stay in browser memory; the app never imports the research snapshots.

Dependencies, build output, test reports, caches, and local environment files are also ignored.
Keep `package-lock.json` in Git so `npm ci` can reproduce the dependency installation.

## Repository

[makss-rivero/web-development-lab-2](https://github.com/makss-rivero/web-development-lab-2)
