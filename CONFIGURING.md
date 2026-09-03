# Configuring the tool

How to change what the app shows — no engine code, just JSON (and optionally
media). For the exhaustive field reference see [SCHEMA.md](SCHEMA.md); this is
the task-oriented guide.

## Where the config lives

Config is grouped by **project** — one project per client / engagement, each
with its own logos and its own set of demos.

```
public/projects/
├─ hdb/                      a project
│  ├─ project.json           title, brand-bar logos, which demos appear (+ order)
│  ├─ branding/              this project's logos
│  └─ scenarios/
│     ├─ email/scenario.json    a demo
│     │  └─ media/              drop real screenshots/videos here (optional)
│     └─ whatsapp/scenario.json a demo
└─ _template/                clone this whole folder to start a new project
```

Each entry in the dropdown is **one plot**. A "demo" = a `scenario.json` (one
plot each, in the current setup).

## Choosing which project to show

Add a `project` query parameter to the URL:

| URL | Loads |
|---|---|
| `http://localhost:5173/` | the default project (`hdb`) |
| `http://localhost:5173/?project=hdb` | `public/projects/hdb/` |
| `http://localhost:5173/?project=acme` | `public/projects/acme/` |

The same works on the live site: `…github.io/agentic-story/?project=acme`.

The default is the `DEFAULT_PROJECT` constant in **`src/config.ts`** — the one
place in the app that names a project. Change it and rebuild to switch which
project a bare URL opens.

## Preview your edits

```bash
npm run dev      # http://localhost:5173
```
Edit a `scenario.json`, save, refresh the browser. If a config is malformed the
app shows a plain-language error naming the problem (it validates on load).

Use the **▦ object gallery** button in the toolbar to see the exact names you
can use for `avatar`, station `variant`, object `base`, `badges`, and agent
`icon`.

## Common edits (recipes)

### Change wording or timing
In a plot's `steps`, edit `caption` (the subtitle text) and `dwell`
(milliseconds that step holds during autoplay).

### Change who triggers it (the avatar + speech bubble)
On an input, edit `persona`:
```jsonc
"persona": { "role": "Site Foreman", "quote": "…their pain point…", "avatar": "inspector" }
```
`avatar` is one of: `worker`, `inspector`, `office`, `person`.

### Add / remove an agent in a station
Each station has an `agents` array. Each agent:
```jsonc
{ "name": "Vision", "icon": "eye",
  "description": "what it does (one line)",
  "output": "what it produces (one line)" }
```
`icon` is one of: `eye`, `tag`, `ticket`, `rename`, `link`, `check`, `shield`.
During playback each agent gets its own popup, shown one at a time. The popup
title is `"<name> Agent"`, `description` is the body, and `output` renders as a
green **Output** line.

### Change the "Value Delivered" cards at the end
The green bar at the end shows **one card per `output-emit` step**. Each card
takes its:
- **title** from the output's `value` (or its `label` if `value` is absent)
- **body** from that `output-emit` **step's `caption`** in the plot

> `outputs[].description` is **not** rendered — editing it changes nothing. To
> reword a card, edit the step `caption`; to retitle it, edit `value`/`label`.

### Change the "Input" line on the avatar popup
On an input, `description` is the body and the optional `inputFormat` renders as
an amber **Input** line:
```jsonc
"inputFormat": "Free-text emails with mixed attachments — PDFs and CAD files."
```

### Add / remove a station
Add/remove an object in `stations` (id, label, `transformTo`, `description`,
`agents`). Then reference it in the plot's `steps` with a `process` (or
`move-to`) step. Optional `"variant": 0..3` picks a different tower look.

### Change how the travelling object looks / transforms
`objectStates` maps a name → `{ base, badges }`:
- `base`: `envelope`, `chat`, `card`, `photo`
- `badges`: any of `tags`, `rename`, `link`, `stamp-green`

Each station's `transformTo` names the state the object becomes there. A step
may override it with its own `transformTo`.

### Add a whole new demo (to an existing project)
1. Copy an existing scenario folder to
   `public/projects/<project>/scenarios/<your-id>/`.
2. Edit its `scenario.json`.
3. Register it in that project's `project.json`:
   ```jsonc
   { "id": "your-id", "title": "Your title", "path": "scenarios/your-id/scenario.json" }
   ```
   Order in this array = order in the dropdown.

### Reorder or hide demos
Reorder (or remove) entries in the project's `scenarios` array. Removing an
entry hides it from the dropdown without deleting the folder.

### Add a whole new project (a new client)
1. Copy `public/projects/_template/` to `public/projects/<project-id>/`.
   Use plain characters in the id — letters, digits, `.`, `-`, `_` — because it
   goes in the URL.
2. Drop the client's logo into `<project-id>/branding/` (the template ships a
   copy of `accenture.svg` plus a `client.svg` placeholder to replace).
3. Edit `<project-id>/project.json`: `title`, the `logos` array, and the
   `scenarios` list.
4. Author the scenarios under `<project-id>/scenarios/`.
5. Open `http://localhost:5173/?project=<project-id>`.

Nothing else needs touching — no engine code, no rebuild config. To make the new
project the one a bare URL opens, change `DEFAULT_PROJECT` in `src/config.ts`.

### Change the logos in the brand bar
Per project, in its `project.json`:
```jsonc
"branding": {
  "productName": "Agentic Factory",
  "logos": [
    { "src": "branding/accenture.svg", "alt": "Accenture", "invert": true },
    { "src": "branding/client.png",    "alt": "Client",    "invert": true }
  ]
}
```
- `src` resolves **relative to the project folder**. Keeping each project's
  logos inside its own `branding/` folder makes the folder a self-contained
  drop-in; if you'd rather share one file across projects, point at the shared
  copy with `"../../branding/accenture.svg"`.
- `invert: true` forces a dark logo white for the purple stage. Omit it for a
  logo that is already light or must keep its brand colours.
- Any number of logos works; they render left to right. A logo file that fails
  to load is silently dropped rather than breaking the bar.
- `productName` is the text beside the logos; omit it to use the app default.

## Media (screenshots / videos)

Media is **optional**. Any input/station/agent may set a `media` path, resolved
**relative to that scenario's folder**, e.g. `"media/capture.mp4"`. Drop a file
of that name into the scenario's `media/` folder.

- If a popup has **no** `media`, it plays the bundled `public/sample.mp4` so the
  slot is always a testable video. Replace it by adding real `media`.
- An agent with no `media` falls back to its **station's** `media`.
- Videos start **paused** and use the browser's native controls (incl.
  fullscreen).

Generate labelled placeholder images for every `media` path a scenario declares:
```bash
node scripts/gen-placeholders.mjs        # every project
node scripts/gen-placeholders.mjs hdb    # just one project
```
It writes `.svg` placeholders wherever a `media` path points.

## Step types (plot flow)

| type | ref | effect |
|---|---|---|
| `actor-intro` | input | avatar + speech bubble (no popup) |
| `input-appear` | input | the item enters; input popup available |
| `move-to` / `process` | station | object travels to / is processed; agent popups |
| `output-emit` | output | object exits in its final state; the **Value Delivered** bar replaces the subtitle and this step's caption becomes its card body |

## After you're happy — publish

See [DEPLOY.md](DEPLOY.md). In short: `git commit`/`git push` the source, then
`npm run deploy` to update the live site.
