# Agentic Factory

A reusable, **config-driven** 2.5D storytelling engine that visualises how
information flows through a line of AI agents — a stylized "information assembly
line" for live demos.

- **Domain-neutral engine, story in config.** To tell a different story, write a
  new JSON file and drop media into a folder. No engine code changes.
- **All art is code-drawn SVG.** No 3D models, icon packs, sprite sheets or stock
  images anywhere. A new scenario needs **zero art work** — the primitive library
  already draws every object, badge, agent icon, avatar and the whole scene.
- **Fully offline.** No CDN, no runtime network calls. Runs on `localhost`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/ (opens offline)
npm run preview  # serve the built bundle
```

## Controls & presentation

- **Autoplay** with timed captions (starts on load).
- **Space** — play / pause.
- **← / →** — step back / forward (pauses autoplay).
- **R** — reset to the start of the plot.
- **F** — fullscreen / kiosk toggle.
- **Scenario switcher** and **plot switcher** — top-left of the control bar.
- **Nav pane** (right) — click any step to jump to it.
- **Click any node or agent** — opens a popup with its description and media;
  this pauses autoplay. Reduced-motion is respected.

## Author a new scenario

1. Copy `public/scenarios/_template/` to `public/scenarios/<your-id>/`.
2. Edit `scenario.json` — see **[SCHEMA.md](SCHEMA.md)** for every field. Compose
   objects from existing bases + badges; pick agent icons and avatars by name.
3. Add your scenario to `public/scenarios/index.json`.
4. Reload — the switcher picks it up. The config is validated on load and any
   problem is reported in plain language.

### Attach media

Each input, station, agent and output has an optional `media` path, resolved
**relative to the scenario folder**. Drop an image (`.png/.jpg/.svg/…`) or video
(`.mp4/.webm/…`) with the referenced filename into the scenario's `media/`
folder. Missing media shows a "media not attached" placeholder — nothing breaks.

Generate labelled placeholder media for the seed scenarios with:

```bash
node scripts/gen-placeholders.mjs
```

## Project structure

```
src/engine/     domain-neutral engine
  primitives.ts   THE art system — every visual as a code-drawn SVG function
  types.ts        the scenario schema, in TypeScript
  schema.ts       config validation with friendly errors
  loader.ts       fetch + parse + validate + media resolution
  scene.ts        builds the interactive SVG stage from config
  runner.ts       plot runner (autoplay, captions, step, reset)
  modal.ts        node / agent media popup
src/ui/app.ts   presentation shell (controls, nav, switchers, fullscreen)
public/scenarios/  JSON + media per story  (email, whatsapp, hdb, _template)
```

Verify the engine stays domain-neutral: the seed scenarios differ **only** in
their config + media, never in engine code.

## Branding

The brand marquee (top-left) is tool chrome, set in `src/ui/app.ts` (`BRANDING`).
`branding.logo` is reserved for an optional drop-in logo image; by default the
mark is code-drawn.
