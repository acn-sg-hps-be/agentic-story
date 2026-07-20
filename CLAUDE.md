# CLAUDE.md — orientation for AI coding sessions

This file orients a fresh Claude Code (or similar) session. Read it first, then
open the specific guide for the task.

## What this project is

**Agentic Factory** — a reusable, **config-driven** 2.5D web app that tells the
story of information flowing through a line of AI agents (a stylized
"information assembly line") for live demos. Vanilla TypeScript + Vite, no
framework. It is a presentation tool, not a real integration.

## Golden rules (do not break these)

1. **The engine contains zero story-specific content.** Everything about a story
   — inputs, stations, agents, outputs, captions, plots — lives in JSON under
   `public/scenarios/`. Nothing in `src/engine/**` may mention a domain term
   (email, WhatsApp, HDB, Autodesk, Forma, etc.).
2. **All visuals are code-drawn SVG**, generated in `src/engine/primitives.ts`.
   No 3D models, icon packs, sprite sheets, or stock images. The only external
   files are (a) optional popup **media** per node/agent and (b) the two logos in
   `public/branding/`. To add a new object type, add a function in
   `primitives.ts` — never an asset file.
3. **Fully static + offline-capable.** No backend, no runtime network calls.
   `npm run build` → `dist/` is the whole app. Must be served over http(s)
   (it `fetch()`es its scenario JSON), not opened as `file://`.

## Where things are

```
src/engine/     domain-neutral engine
  primitives.ts   THE art system (bases, badges, agent icons, avatars, furniture)
  types.ts        the scenario schema, in TypeScript
  schema.ts       config validation (friendly errors)
  loader.ts       fetch + parse + validate + media path resolution
  scene.ts        builds the interactive SVG stage from config (per plot)
  runner.ts       plot runner: expands steps into "beats", autoplay/step/reset
  modal.ts        the node/agent media popup
src/ui/
  app.ts          presentation shell (dropdown, controls, captions, keyboard, help)
  gallery.ts      the object-gallery overlay (shows primitive names)
public/scenarios/ JSON + media per story  (whatsapp, email, _template) + index.json
public/branding/  accenture.svg, hdb.svg  (rendered white via CSS filter)
public/sample.mp4  CC0 video used when a popup has no real media yet
```

## Commands

```bash
npm install         # first time
npm run dev         # local preview at http://localhost:5173
npx tsc --noEmit    # type-check (use this to verify; the repo is strict TS)
npm run build       # production build → dist/
npm run deploy      # build + publish dist/ to the gh-pages branch
```

## Task pointers

- **Configure / author a story** → read [CONFIGURING.md](CONFIGURING.md) and
  [SCHEMA.md](SCHEMA.md). Only edit `public/scenarios/**`. Never add story
  content to `src/**`.
- **Publish / deploy** → read [DEPLOY.md](DEPLOY.md).
- **Change the look / add a primitive** → `src/engine/primitives.ts`, then check
  it in the in-app **object gallery** (▦ button).

## Current behaviour (so you don't "fix" it by mistake)

- On load: a **welcome dialog** appears; playback is **paused** (no autoplay).
- One **demo dropdown** (each plot is a demo); there is **no separate plot
  dropdown and no side step-panel** — the bottom **caption bar** is the subtitle.
- Steps play as **beats**: a station is highlighted first (popup closed), then
  its agents' popups show one at a time; advancing closes them.
- **Inputs** are shown by clicking the **avatar**; **outputs** are described
  **per-agent** (there is intentionally **no output popup**).
- A popup with no real `media` plays `public/sample.mp4` so the slot is testable.

## Verifying changes

Prefer `npx tsc --noEmit` plus a manual look at `http://localhost:5173`. The
automated browser-screenshot tooling is unreliable in this environment; don't
depend on it.
