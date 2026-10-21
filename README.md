# Latvia Data Desk

A university web development project exploring population, employment, and earnings across Latvia's
five statistical regions. The planned dashboard uses official statistics from Latvia's Central
Statistical Bureau and follows the Data Desk design.

The project configuration and runtime statistics client are implemented. The current page provides
a small Rīga data preview with loading, refresh, and retry controls. The regional map and full
dashboard layout are the next implementation stages.

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
indentation. Run `npm run format` to format the whole project. Existing `.prettierignore` rules apply.

Always use braces for `if`, `else`, and loops, including single statements. ESLint's
[`curly` rule](https://eslint.org/docs/latest/rules/curly) enforces this. With the recommended ESLint
extension enabled, VS Code applies available fixes when you save with Cmd+S or Ctrl+S.

## Project structure

```text
public/           Static assets
src/
  components/     Reserved for dashboard components
  data/           One module for CSB queries, cached responses, and value lookup
  styles/         Application styles
  utils/          Reserved for shared utilities
  App.tsx         Application entry component
  main.tsx        React bootstrap
scripts/          Reserved for geometry preparation
```

## Statistics at runtime

[statistics.ts](src/data/statistics.ts) fetches four tables from the
[CSB API v2](https://stat.gov.lv/en/api-un-kodu-vardnicas/api-v2), keeps them in memory, and looks up
values by region, year, and metric. All queries cover 2021–2025, the five regions, and Latvia (`LV`).
No backend, API key, or extra data library is needed.

| Table                                                                            | Data                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [IRS031](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__POP__IR__IRS/IRS031/)  | Population at the beginning of the year                                   |
| [NBA031](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__NBB__NBA/NBA031/) | Annual employment and unemployment rates, ages 15–74                      |
| [DSV041](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__DS__DSV/DSV041/)  | Annual average gross/net monthly earnings in full-time units, all sectors |
| [NBL061](https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__NB__NBLA/NBL061/) | Employment by industry: published counts in thousands and percentages     |

`App.tsx` uses ordinary React state for loading, data, and retry feedback. The initial load makes
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

## Verification

Run `npm run check` and `npm run build`. These do not need the live statistics API.
Review loading, refresh, and retry in the browser, including a blocked request or offline state.
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
