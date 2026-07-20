# Agentic Factory

A reusable, **config-driven** 2.5D storytelling app that visualises how
information flows through a line of AI agents — a stylized "information assembly
line" for live demos.

- **Domain-neutral engine, story in config.** To tell a different story, edit a
  JSON file in `public/scenarios/` and (optionally) drop media into a folder. No
  engine code changes.
- **All art is code-drawn SVG.** No 3D models, icon packs, or stock images. A
  new scenario needs zero art work — the primitive library draws every object,
  badge, agent icon, avatar and the whole scene.
- **Fully static.** No backend, no runtime network calls. Builds to a folder you
  can host anywhere over http(s).

## Guides

| I want to… | Read |
|---|---|
| Understand the project / rules (for an AI session) | [CLAUDE.md](CLAUDE.md) |
| Change what the demo shows | [CONFIGURING.md](CONFIGURING.md) |
| Every config field, precisely | [SCHEMA.md](SCHEMA.md) |
| Publish / update the live site | [DEPLOY.md](DEPLOY.md) |

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static bundle in dist/
npm run preview   # serve the built bundle
```

## Using it (presentation)

On load you get a short **welcome dialog**; playback starts **paused**.

- **⛶ Fullscreen** (or press **F**) — best on a projector.
- **▶ Play** to auto-run, or **◀ ▶** / **← →** arrow keys to step through.
- Each step **highlights a station**, then shows its **agents' popups one at a
  time**; advancing closes them.
- **Click the person** to see the incoming request; **click an agent** for what
  it does and what it produces. Clicking pauses playback.
- **Dropdown** switches demos. **▦** opens the object gallery (shows the
  primitive names you can use in config).
- **↺** resets to the start. Reduced-motion is respected.

## Project structure

```
src/engine/     domain-neutral engine
  primitives.ts   THE art system — every visual as a code-drawn SVG function
  types.ts        the scenario schema, in TypeScript
  schema.ts       config validation with friendly errors
  loader.ts       fetch + parse + validate + media resolution
  scene.ts        builds the interactive SVG stage from config
  runner.ts       plot runner (beats: highlight → agent popups → …)
  modal.ts        node / agent media popup
src/ui/
  app.ts          presentation shell (dropdown, controls, captions, help)
  gallery.ts      object-gallery overlay
public/scenarios/  JSON + media per story (whatsapp, email, _template) + index.json
public/branding/   Accenture + HDB logos
public/sample.mp4  placeholder video for popups without real media
```

## Deploy

Hosted on GitHub Pages from the `gh-pages` branch. To publish an update:

```bash
git add -A && git commit -m "update" && git push   # source
npm run deploy                                      # live site → gh-pages
```

Full details, first-time Pages setup, and troubleshooting: [DEPLOY.md](DEPLOY.md).

## Branding

The brand bar (top-left) shows `public/branding/accenture.svg` + `hdb.svg`
(rendered white for the dark stage) alongside the product name set in
`src/ui/app.ts` (`BRANDING`). Replace either logo file to rebrand.
