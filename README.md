# Weather (Ionic Vue)

A small **Ionic Vue** single-page app that shows **hourly air temperature** for a fixed location near **Jakarta**, using the public **[Open-Meteo](https://open-meteo.com/)** forecast API. It is built with **Vue 3**, **Vite**, and **Capacitor-ready** dependencies so you can run it in the browser or wrap it as a native shell.

## What this project is

- **Stack:** Vue 3 + Ionic Vue 8 + Vue Router + Vite 5 + TypeScript.
- **UI:** Ionic layout (`ion-page`, `ion-header`, `ion-content`, lists, cards, refresher, toolbar refresh) with a dark-themed screen showing current temperature, a 24-hour strip, and a full hourly list.
- **Data:** Client-side `fetch` to `https://api.open-meteo.com/v1/forecast` with latitude/longitude near Jakarta, `hourly=temperature_2m`, and `timezone=Asia/Jakarta`. No API key is required.
- **Native option:** `capacitor.config.ts` points `webDir` at `dist`, so after a web build you can sync and open Android Studio or Xcode with the Capacitor CLI.

## How the app is structured

| Piece | Role |
|--------|------|
| `src/main.ts` | Registers `IonicVue`, router, Ionic core CSS, and dark palette. |
| `src/App.vue` | Root `ion-app` and `ion-router-outlet`. |
| `src/router/index.ts` | `/` redirects to `/home`; history mode uses `import.meta.env.BASE_URL` (Vite base). |
| `src/views/HomePage.vue` | Thin view that renders the main component. |
| `src/components/WeatherDisplay.vue` | Loads forecast on mount, handles errors/loading, pull-to-refresh and toolbar refresh, formats times with the device locale, and renders the hero, hourly strip, and list. |

Runtime flow: open the app → `onMounted` calls `fetchWeather` → JSON is parsed into typed hourly slots → computed properties pick the “current” hour relative to the device clock, derive the next 24 hours for the strip, and show min/max in that window.

## Prerequisites

- **Node.js** (LTS such as 20 or 22 is a safe choice) and **npm**.
- Optional: **[Ionic CLI](https://ionicframework.com/docs/cli)** globally if you prefer `ionic serve` / `ionic build` instead of npm scripts.

```bash
npm install -g @ionic/cli
```

## Clone and run locally

```bash
git clone <repository-url>
cd Weather
npm install
```

**Development server (Vite):**

```bash
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

**With Ionic CLI (equivalent dev experience for this template):**

```bash
ionic serve
```

**Production build (typecheck + Vite build to `dist/`):**

```bash
npm run build
```

**Preview the production build locally:**

```bash
npm run preview
```

Other scripts: `npm run lint`, `npm run test:unit`, `npm run test:e2e`.

## Deploy with Ionic (after clone, Node available)

The app is a standard Vite SPA. “Deploy with Ionic” here means: **build the web assets**, then **host the `dist` folder** or **sync to Capacitor** for app stores.

### 1. Web build

```bash
npm install
npm run build
```

Or with the CLI:

```bash
ionic build
```

Output is in **`dist/`**. Any static host can serve that directory as the site root.

### 2. Optional: Capacitor (Android / iOS)

This repo includes Capacitor config but may not ship `android/` / `ios/` folders until you add platforms.

```bash
npm run build
npx cap add android   # and/or: npx cap add ios
npx cap sync
npx cap open android  # or: npx cap open ios
```

Build and sign release binaries in Android Studio or Xcode. The WebView loads the same `dist` bundle; ensure the device has network access for Open-Meteo.

## Deploy on any platform (generic)

All of these boil down to **uploading the contents of `dist/` after `npm run build`**.

| Target | Idea |
|--------|------|
| **Netlify / Vercel / Cloudflare Pages** | Connect the repo or drag-drop `dist`; set **build command** to `npm run build` and **publish directory** to `dist`. |
| **Nginx / Apache / any static file server** | Copy `dist/*` to the web root and enable SPA fallback to `index.html` for client-side routes (`/home`, etc.). |
| **S3 + CloudFront (or similar)** | Upload `dist` assets; configure default root object and error page to `index.html` for SPA routing if needed. |
| **GitHub Pages** | If the site is not at domain root, set Vite `base` in `vite.config.ts` to your repo path (e.g. `/Weather/`) and rebuild, then publish `dist`. |

**Note:** Open-Meteo is called from the **browser** (or WebView). You do not need a backend for this demo; only HTTPS-capable hosting and outbound HTTPS from the client.

## Configuration notes

- **Location** is fixed in `WeatherDisplay.vue` (`LATITUDE` / `LONGITUDE`). Change those constants to point the UI at another region (and adjust `timezone` if needed).
- **`vite.config.ts`** does not set a custom `base`; use the default `/` unless you deploy under a subpath.

## License

This project’s **original application code and assets in this repository** are released under **[The Unlicense](https://unlicense.org/)** (also referenced as `Unlicense` in `package.json`). The full legal text is in the [`LICENSE`](LICENSE) file at the repository root.
