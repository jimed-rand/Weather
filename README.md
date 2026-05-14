# Weather (Ionic app)

A small **Ionic app** single-page app that shows **hourly air temperature** for a fixed location near **Jakarta**, using the public **[Open-Meteo](https://open-meteo.com/)** forecast API. It is built with **Vue 3**, **Vite**, and **Capacitor-ready** dependencies so you can run it in the browser or wrap it as a native shell.

## Disclaimer for students

This repository’s **original code is in the public domain** under [The Unlicense](https://unlicense.org/) (see the [`LICENSE`](LICENSE) file). You may copy, study, or reuse it without asking for permission.

**If you use it for graded coursework** (homework, projects, theses, portfolios your school assesses), treat it like any other source: **fork the repository**, **cite or acknowledge** where your starting point came from if your instructor or institution requires it, and **change and extend it enough** that the work you submit is clearly **your own analysis, design, and implementation**—not a verbatim resubmission of this app. Submitting this project unchanged (or with only cosmetic edits) can still count as **plagiarism or academic dishonesty** under many honor codes, even when the license allows copying.

When in doubt, **ask your instructor** what reuse, attribution, and “sufficient originality” mean for your course.

## What this project is

- **Stack:** Vue 3 + Ionic Vue 8 + Vue Router + Vite 5 + TypeScript.
- **UI:** Ionic layout (`ion-page`, `ion-header`, `ion-content`, lists, cards, refresher) with a **light** themed screen showing current temperature, a 24-hour strip, and a full hourly list. To get new data after load, reload the page (F5 on desktop, or scroll from the top to refresh on mobile).
- **Data:** Client-side `fetch` to `https://api.open-meteo.com/v1/forecast` with latitude/longitude near Jakarta, `hourly=temperature_2m`, and `timezone=Asia/Jakarta`. No API key is required.
- **Native option:** `capacitor.config.ts` points `webDir` at `dist`, so after a web build you can sync and open Android Studio or Xcode with the Capacitor CLI.

## How the app is structured

| Piece | Role |
|--------|------|
| `src/main.ts` | Registers `IonicVue`, router, Ionic core CSS, and `./theme/variables.css` (light theme; no system dark palette import). |
| `src/App.vue` | Root `ion-app` and `ion-router-outlet`. |
| `src/router/index.ts` | `/` redirects to `/home`; history mode uses `import.meta.env.BASE_URL` (Vite base). |
| `src/views/HomePage.vue` | Thin view that renders the main component. |
| `src/components/WeatherDisplay.vue` | Loads forecast on mount, handles errors/loading, pull-to-refresh, formats times with the device locale, and renders the hero, hourly strip, and list. |

Runtime flow: open the app → `onMounted` calls `fetchWeather` → JSON is parsed into typed hourly slots → computed properties pick the “current” hour relative to the device clock, derive the next 24 hours for the strip, and show min/max in that window.

## Prerequisites

- **Node.js** (LTS such as 20 or 22 is a safe choice) and **npm**, installed **once** on your computer (not inside this folder). See [nodejs.org](https://nodejs.org/) or your OS package manager.
- Optional: **[Ionic CLI](https://ionicframework.com/docs/cli)** installed globally if you prefer `ionic serve` / `ionic build` instead of npm scripts.

```bash
npm install -g @ionic/cli
```

That only adds the `ionic` command to your PATH. It does **not** remove the need for a local `node_modules` in this project (see below).

---

## Node, `node_modules`, and “global” installs (important)

If you would rather not think about Node, this section is the one paragraph to remember:

**This app’s libraries (Vue, Ionic, Vite, TypeScript, …) must live in a `node_modules` folder next to `package.json`.** That is how Node’s module resolution and Vite’s bundler work. There is **no supported way** to “install all project dependencies with `npm install -g` as root and skip `node_modules`” while still building or running this repo normally.

| What you run | What it is for |
|----------------|----------------|
| **`npm install`** (inside the project, no `-g`) | Installs the exact dependency tree for **this** app into **`./node_modules`**. Required for `npm run dev`, `npm run build`, tests, etc. |
| **`npm install -g some-package`** | Installs **one tool** (a CLI) onto your machine, e.g. `@ionic/cli`. Use sparingly for commands you want in every terminal. |

**Why not install everything globally as root?**

- Global installs are a **single shared version** tree. This project pins versions in `package.json` / lockfile so builds stay reproducible; globals ignore that.
- Running `sudo npm install -g` is **discouraged** (permission and security issues) and still **does not** make Vite resolve `@ionic/vue` from your project without `node_modules`.

**What actually reduces pain:**

1. Run **`npm install` once** after clone; day to day you only run **`npm run dev`** or **`npm run build`**.
2. **`node_modules` is not committed to git** (it stays on your disk only). Delete the folder anytime and run `npm install` again if something looks corrupted.
3. If you hate touching your OS Node install, use a **version manager** (`fnm`, `nvm`, …) so Node lives under your home directory, or run builds inside **Docker** / a **dev container** so the “environment” is disposable.

You do **not** need administrator/root rights for a normal local `npm install` in your own project directory.

---

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

You need **`npm install` done first** so `npx cap` can find the Capacitor CLI from `devDependencies`. You do **not** have to install Capacitor globally.

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
