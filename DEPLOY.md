# Deploying / publishing the tool

The app is a **static site** — `npm run build` produces a `dist/` folder that
already contains everything (compiled app + all scenarios, media, logos, and
`sample.mp4` from `public/`). It's hosted on **GitHub Pages** from a `gh-pages`
branch, using the [`gh-pages`](https://www.npmjs.com/package/gh-pages) npm tool.

- Repo: `https://github.com/acn-sg-hps-be/agentic-story`
- Live site: `https://acn-sg-hps-be.github.io/agentic-story/`

`vite.config.ts` sets `base: './'` so asset and fetch URLs are relative and work
under the Pages project sub-path without hardcoding the repo name.

> It must be served over http(s) (it `fetch()`es its scenario JSON). Opening
> `dist/index.html` directly via `file://` will not work.

## Already set up

- `package.json` scripts: `predeploy` → `npm run build`, `deploy` →
  `gh-pages -d dist -t` (publishes `dist/` to the `gh-pages` branch).
- Git remote `origin` → the repo above; `main` holds the source.

## First-time only: enable Pages

In the repo on GitHub: **Settings → Pages → Source: "Deploy from a branch" →
Branch: `gh-pages` / `(root)` → Save.** Wait ~1 minute for the first build.

## Publish an update (the normal loop)

From `C:\repos\agentic-story`:

```bash
# 1) commit + push the source (keeps main in sync)
git add -A
git commit -m "update scenarios"
git push

# 2) build and publish the live site
npm run deploy
```

`npm run deploy` rebuilds and force-updates the `gh-pages` branch; the live URL
refreshes within a minute. You only do the Settings → Pages step once.

## Deploy from a fresh machine / clone

```bash
git clone https://github.com/acn-sg-hps-be/agentic-story.git
cd agentic-story
npm install
npm run deploy      # needs the origin remote (present after clone)
```

## Troubleshooting

- **404 right after enabling Pages** — first build takes a minute; confirm
  Source = branch `gh-pages`, folder `(root)`.
- **Old content after deploy** — hard-refresh (Ctrl/Cmd+Shift+R); Pages CDN can
  cache briefly.
- **Assets 404 under the sub-path** — ensure `vite.config.ts` still has
  `base: './'`.
- **`gh-pages` not found** — run `npm install` (it's a devDependency).
- **Push auth prompts** — this repo uses your local Git credentials (Git
  Credential Manager on Windows), same as any other repo in the org.

## Note on visibility

The repo/org is public, so the site and its media are publicly reachable. Don't
attach confidential screenshots/videos as scenario media unless that's intended.
