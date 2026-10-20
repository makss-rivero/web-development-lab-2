# Latvia Data Desk

A university web development project exploring population, employment, and earnings across Latvia's
five statistical regions. The planned dashboard uses official statistics from Latvia's Central
Statistical Bureau and follows the Data Desk design.

The initial project configuration is implemented. Statistics data preparation and the dashboard
features are the next implementation stages.

## Requirements

- Node.js 24; the development version is pinned in `.nvmrc`.
- npm 11.

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

## Project structure

```text
public/           Static assets
src/
  components/     Dashboard components
  data/           Prepared application data and source metadata
  styles/         Application styles
  utils/          Formatting and data utilities
  App.tsx         Application entry component
  main.tsx        React bootstrap
scripts/          Data and geometry preparation scripts
```

The component, data, utility, and script folders are reserved for the next implementation steps.

## Local references and generated files

`drafts/` and `research/` are local design and research references. Git, ESLint, and Prettier exclude
these folders. A fresh checkout runs without them.

The selected design reference is `drafts/04-data-desk-v2.html` when those local files are available.
Production data assets and source metadata will be prepared in Step 2 and committed separately.

Dependencies, build output, test reports, caches, and local environment files are also ignored.
Keep `package-lock.json` in Git so `npm ci` can reproduce the dependency installation.

## Repository

[makss-rivero/web-development-lab-2](https://github.com/makss-rivero/web-development-lab-2)
